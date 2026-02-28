import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { isToday, isThisWeek, isThisMonth } from 'date-fns'

// Types for dashboard data
interface ClientData {
  id: string
  first_name: string
  last_name: string
  status: string
  [key: string]: any
}

interface ClassData {
  id: string
  name: string
  date: string
  status: string
  max_capacity: number
  current_enrollment: number
  [key: string]: any
}

interface PaymentData {
  id: string
  amount: number
  status: string
  paid_date?: string
  due_date?: string
  description?: string
  client_id: string
  [key: string]: any
}

interface AttendanceData {
  id: string
  client_id: string
  class_id: string
  date: string
  status: string
  [key: string]: any
}

// GET /api/dashboard - Get dashboard data with role-based access control
// - Admin: Can view all data (all trainers, all classes, all clients, all payments)
// - Trainer: Can only view their own data (own classes, enrolled clients, related payments)
export async function GET() {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // Not needed for reading, but required by the interface
          },
        },
      }
    )

    // Create admin client for role queries
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check user role (using admin client to bypass RLS)
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    // Only allow admin and coach access
    if (userRole.role !== 'admin' && userRole.role !== 'trainer') {
      return NextResponse.json({ 
        error: 'Access denied. Admin or coach role required.' 
      }, { status: 403 })
    }

    // Get trainer ID if user is a trainer
    let trainerData = null
    if (userRole.role === 'trainer') {
      const { data: trainer, error: trainerError } = await supabaseAdmin
        .from('trainers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (trainerError || !trainer) {
        return NextResponse.json({ 
          error: 'Trainer profile not found' 
        }, { status: 403 })
      }
      trainerData = { id: trainer.id, type: 'trainer' }
    }

    // Build queries based on user role
    let classesQuery = supabaseAdmin.from('classes').select('*')
    let paymentsQuery = supabaseAdmin.from('payments').select(`
      *,
      client:client_signups(id, first_name, last_name, email)
    `)
    let attendanceQuery = supabaseAdmin.from('attendance').select(`
      *,
      client:client_signups(id, first_name, last_name, email),
      class:classes(id, name, date)
    `)
    let clientsQuery = supabaseAdmin.from('client_signups').select('*')

    // Apply role-based filtering
    if (userRole.role === 'trainer' && trainerData) {
      // Filter by trainer_id for trainer table
      classesQuery = classesQuery.eq('trainer_id', trainerData.id)
      
      // Get class IDs for this trainer to filter related data
      const { data: trainerClasses } = await classesQuery.order('date', { ascending: false })
      const classIds = trainerClasses?.map(cls => cls.id) || []
      
      if (classIds.length > 0) {
        // Filter attendance to only classes taught by this trainer
        attendanceQuery = attendanceQuery.in('class_id', classIds)
        
        // Filter payments to only clients enrolled in this trainer's classes
        const { data: enrollments } = await supabaseAdmin
          .from('class_enrollments')
          .select('client_id')
          .in('class_id', classIds)
        
        const clientIds = [...new Set(enrollments?.map(e => e.client_id) || [])]
        if (clientIds.length > 0) {
          paymentsQuery = paymentsQuery.in('client_id', clientIds)
          clientsQuery = clientsQuery.in('id', clientIds)
        } else {
          // No clients for this trainer
          paymentsQuery = paymentsQuery.eq('client_id', 'none') // Will return empty
          clientsQuery = clientsQuery.eq('id', 'none') // Will return empty
        }
      } else {
        // No classes for this trainer, return empty data
        attendanceQuery = attendanceQuery.eq('class_id', 'none')
        paymentsQuery = paymentsQuery.eq('client_id', 'none')
        clientsQuery = clientsQuery.eq('id', 'none')
      }
    }

    // Fetch all data in parallel using admin client with applied filters
    const [clientsRes, classesRes, paymentsRes, attendanceRes] = await Promise.all([
      clientsQuery.order('submitted_at', { ascending: false }),
      classesQuery.order('date', { ascending: false }),
      paymentsQuery.order('paid_date', { ascending: false }),
      attendanceQuery.order('date', { ascending: false })
    ])

    // Extract data and handle errors
    const clients = clientsRes.data || []
    const classes = classesRes.data || []
    const payments = paymentsRes.data || []
    const attendance = attendanceRes.data || []

    // Fetch trainers separately to avoid relationship issues
    // Role-based filtering: trainers only see themselves, admins see all
    const trainersQuery = userRole.role === 'admin' ? 
      supabaseAdmin.from('trainers').select('id, first_name, last_name, email') :
      supabaseAdmin.from('trainers').select('id, first_name, last_name, email').eq('user_id', user.id)

    const trainersRes = await trainersQuery
    
    const trainers = trainersRes.data || []
    
    // Create map for quick lookup
    const trainerMap = new Map(trainers.map(trainer => [trainer.id, trainer]))
    
    // Merge trainer data with classes
    const classesWithTrainers = classes.map((cls: any) => {
      let trainer = null
      
      // Get trainer from trainer_id
      if (cls.trainer_id) {
        trainer = trainerMap.get(cls.trainer_id)
      }
      
      return {
        ...cls,
        trainer,
        instructor: trainer // Keep instructor property for backward compatibility in UI
      }
    })

    // Log any errors
    if (clientsRes.error) console.warn('Error fetching clients:', clientsRes.error)
    if (classesRes.error) console.warn('Error fetching classes:', classesRes.error)
    if (paymentsRes.error) console.warn('Error fetching payments:', paymentsRes.error)
    if (attendanceRes.error) console.warn('Error fetching attendance:', attendanceRes.error)
    if (trainersRes.error) console.warn('Error fetching trainers:', trainersRes.error)

    // Log role-based filtering for debugging
    console.log(`Dashboard access: User ${user.id} with role ${userRole.role}`)
    if (userRole.role === 'trainer') {
      console.log(`Trainer filtering: ID ${trainerData?.id}, Type: ${trainerData?.type}`)
      console.log(`Filtered data: ${classes.length} classes, ${clients.length} clients, ${payments.length} payments`)
    }

    const today = new Date()
    
    // Calculate stats
    const todaysClasses = classesWithTrainers
      .filter((cls: any) => isToday(new Date(cls.date)))
      .map((cls: any) => ({
        ...cls,
        instructor_name: cls.trainer ? 
          `${cls.trainer.first_name} ${cls.trainer.last_name}` : 
          'No coach assigned'
      }))
    const weeklyPayments = payments.filter((payment: any) => 
      payment.paid_date && payment.status === 'completed' && isThisWeek(new Date(payment.paid_date))
    )
    const monthlyPayments = payments.filter((payment: any) => 
      payment.paid_date && payment.status === 'completed' && isThisMonth(new Date(payment.paid_date))
    )
    
    const weeklyRevenue = weeklyPayments.reduce((sum: number, payment: any) => sum + (Number(payment.amount) || 0), 0)
    const monthlyRevenue = monthlyPayments.reduce((sum: number, payment: any) => sum + (Number(payment.amount) || 0), 0)
    
    const totalAttendance = attendance.length
    const presentAttendance = attendance.filter((att: any) => att.status === 'present').length
    const attendanceRate = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0

    const stats = {
      totalClients: clients.length,
      activeClients: clients.filter((client: any) => client.status === 'enrolled').length,
      totalClasses: classesWithTrainers.length,
      todaysClasses: todaysClasses.length,
      upcomingClasses: classesWithTrainers.filter((cls: ClassData) => 
        new Date(cls.date) > today && cls.status === 'scheduled'
      ).length,
      weeklyRevenue,
      monthlyRevenue,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      pendingPayments: payments.filter((payment: any) => payment.status === 'pending').length,
      overduePayments: payments.filter((payment: any) => {
        return payment.status === 'pending' && 
               payment.due_date && 
               new Date(payment.due_date) < today
      }).length
    }

    // Recent activity (last 10 items)
    const recentAttendance = attendance.slice(0, 5).map((att: any) => ({
      type: 'attendance',
      title: `${att.client?.first_name || 'Unknown'} ${att.client?.last_name || 'Client'} ${
        att.status === 'present' ? 'attended' : 'missed'
      } ${att.class?.name || 'class'}`,
      time: att.date,
      status: att.status,
      icon: att.status === 'present' ? 'CheckCircle' : 'XCircle'
    }))

    const recentPayments = payments
      .filter((payment: any) => payment.status === 'completed')
      .slice(0, 5)
      .map((payment: any) => ({
        type: 'payment',
        title: `${payment.client?.first_name || 'Unknown'} ${payment.client?.last_name || 'Client'} - ${
          payment.description || 'Payment'
        }`,
        time: payment.paid_date || payment.created_at,
        amount: payment.amount,
        icon: 'DollarSign'
      }))

    const recentActivity = [...recentAttendance, ...recentPayments]
      .filter(activity => activity.time)
      .sort((a, b) => new Date(b.time as string).getTime() - new Date(a.time as string).getTime())
      .slice(0, 8)

    // Monthly revenue data for chart (last 12 months)
    const currentYear = new Date().getFullYear()
    let revenueChartData = []
    try {
      // Get monthly revenue data using admin client with role-based filtering
      let monthlyRevenueQuery = supabaseAdmin
        .from('payments')
        .select('amount, paid_date')
        .eq('status', 'completed')
        .gte('paid_date', `${currentYear}-01-01`)
        .lte('paid_date', `${currentYear}-12-31`)
        .order('paid_date')

      // Apply same filtering for trainers
      if (userRole.role === 'trainer' && trainerData) {
        // Get client IDs for this trainer's classes
        const trainerClassesForRevenue = await (userRole.role === 'admin' ? 
          supabaseAdmin.from('classes').select('id') :
          supabaseAdmin.from('classes').select('id').eq('trainer_id', trainerData.id)
        )
        
        const classIds = trainerClassesForRevenue.data?.map(cls => cls.id) || []
        
        if (classIds.length > 0) {
          const { data: enrollments } = await supabaseAdmin
            .from('class_enrollments')
            .select('client_id')
            .in('class_id', classIds)
          
          const clientIds = [...new Set(enrollments?.map(e => e.client_id) || [])]
          if (clientIds.length > 0) {
            monthlyRevenueQuery = monthlyRevenueQuery.in('client_id', clientIds)
          } else {
            monthlyRevenueQuery = monthlyRevenueQuery.eq('client_id', 'none')
          }
        } else {
          monthlyRevenueQuery = monthlyRevenueQuery.eq('client_id', 'none')
        }
      }

      const { data: monthlyRevenueData, error: revenueError } = await monthlyRevenueQuery

      if (revenueError) {
        console.warn('Error fetching monthly revenue data:', revenueError)
        throw revenueError
      }

      // Group by month
      const monthlyTotals: { [key: number]: number } = {}
      monthlyRevenueData?.forEach((payment: any) => {
        if (payment.paid_date) {
          const month = new Date(payment.paid_date).getMonth() + 1 // 1-based
          monthlyTotals[month] = (monthlyTotals[month] || 0) + (Number(payment.amount) || 0)
        }
      })

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      revenueChartData = monthNames.map((month, index) => ({
        month,
        revenue: monthlyTotals[index + 1] || 0
      }))
    } catch (error) {
      console.warn('Error fetching monthly revenue data:', error)
      // Provide default empty data for chart
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      revenueChartData = monthNames.map(month => ({
        month,
        revenue: 0
      }))
    }

    // Top clients by classes attended
    const clientAttendance = clients.map((client: ClientData) => {
      const clientAttendanceCount = attendance.filter((att: AttendanceData) => 
        att.client_id === client.id && att.status === 'present'
      ).length
      return {
        ...client,
        classes_attended: clientAttendanceCount
      }
    }).sort((a, b) => b.classes_attended - a.classes_attended).slice(0, 5)

    // Upcoming classes with enrollment info
    const upcomingClassesDetailed = classesWithTrainers
      .filter((cls: ClassData) => new Date(cls.date) >= today && cls.status === 'scheduled')
      .slice(0, 10)
      .map((cls: any) => ({
        ...cls,
        instructor_name: cls.trainer ? 
          `${cls.trainer.first_name} ${cls.trainer.last_name}` : 
          'No coach assigned',
        enrollment_percentage: cls.max_capacity > 0 ? 
          Math.round((cls.current_enrollment / cls.max_capacity) * 100) : 0
      }))

    // Get overdue payments with error handling
    let overduePayments: PaymentData[] = []
    try {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      let overduePaymentsQuery = supabaseAdmin
        .from('payments')
        .select('*')
        .eq('status', 'pending')
        .lt('due_date', today)
        .order('due_date', { ascending: true })

      // Apply same filtering for trainers
      if (userRole.role === 'trainer' && trainerData) {
        // Get client IDs for this trainer's classes
        const trainerClassesForOverdue = await (userRole.role === 'admin' ? 
          supabaseAdmin.from('classes').select('id') :
          supabaseAdmin.from('classes').select('id').eq('trainer_id', trainerData.id)
        )
        
        const classIds = trainerClassesForOverdue.data?.map(cls => cls.id) || []
        
        if (classIds.length > 0) {
          const { data: enrollments } = await supabaseAdmin
            .from('class_enrollments')
            .select('client_id')
            .in('class_id', classIds)
          
          const clientIds = [...new Set(enrollments?.map(e => e.client_id) || [])]
          if (clientIds.length > 0) {
            overduePaymentsQuery = overduePaymentsQuery.in('client_id', clientIds)
          } else {
            overduePaymentsQuery = overduePaymentsQuery.eq('client_id', 'none')
          }
        } else {
          overduePaymentsQuery = overduePaymentsQuery.eq('client_id', 'none')
        }
      }

      const { data: overduePaymentsData, error: overdueError } = await overduePaymentsQuery

      if (overdueError) {
        console.warn('Error fetching overdue payments:', overdueError)
      } else {
        overduePayments = overduePaymentsData || []
      }
    } catch (error) {
      console.warn('Error fetching overdue payments:', error)
    }

    return NextResponse.json({
      stats,
      todaysClasses: todaysClasses.slice(0, 10),
      recentActivity,
      revenueChartData,
      topClients: clientAttendance,
      upcomingClasses: upcomingClassesDetailed,
      alerts: {
        expiringMemberships: [], // Temporarily empty since we don't have membership expiry logic yet
        overduePayments,
        lowCapacityClasses: upcomingClassesDetailed.filter((cls: any) => 
          cls.enrollment_percentage < 50 && 
          new Date(cls.date).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000 // Within 7 days
        )
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
