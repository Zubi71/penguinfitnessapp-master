import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { subDays, startOfDay, endOfDay, format, parseISO, getDay, getHours } from 'date-fns'

// Runtime configuration for Vercel
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ClassData {
  id: string
  name: string
  date: string
  start_time: string
  status: string
  class_type: string
  trainer_id?: string
  max_capacity: number
  current_enrollment: number
  [key: string]: any
}

interface EnrollmentData {
  id: string
  client_id: string
  class_id: string
  enrollment_date: string
  status: string
  created_at: string
  updated_at: string
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

interface PaymentData {
  id: string
  amount: number
  status: string
  paid_date?: string
  client_id: string
  [key: string]: any
}

// Helper function to get day name from date
function getDayName(date: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[getDay(parseISO(date))]
}

// Helper function to extract hour from time string
function extractHour(timeString: string): number {
  if (!timeString) return 0
  const parts = timeString.split(':')
  return parseInt(parts[0]) || 0
}

// GET /api/insights - Get insights data with role-based access control
export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const cookieStore = await cookies()
    const { searchParams } = new URL(request.url)
    
    // Validate and sanitize days parameter
    const daysParam = searchParams.get('days') || '30'
    const days = Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 365) // Clamp between 1 and 365
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // Not needed for reading
          },
        },
      }
    )

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check user role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    if (userRole.role !== 'admin' && userRole.role !== 'trainer') {
      return NextResponse.json({ 
        error: 'Access denied. Admin or trainer role required.' 
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
      trainerData = { id: trainer.id }
    }

    // Calculate date range for filtering results (not for initial query)
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    const startDateStr = format(startOfDay(startDate), 'yyyy-MM-dd')
    const endDateStr = format(endOfDay(endDate), 'yyyy-MM-dd')

    // For insights, we need to get ALL data first, then filter by date range in analysis
    // This ensures we can analyze trends even if data is outside the selected range
    let classesQuery = supabaseAdmin
      .from('classes')
      .select('*')

    let enrollmentsQuery = supabaseAdmin
      .from('class_enrollments')
      .select('*')

    let attendanceQuery = supabaseAdmin
      .from('attendance')
      .select('*')

    let paymentsQuery = supabaseAdmin
      .from('payments')
      .select('*')
      .eq('status', 'completed')

    // Apply role-based filtering
    if (userRole.role === 'trainer' && trainerData) {
      // For trainers, filter by trainer_id directly (primary method)
      // Also check instructor_id as fallback for backward compatibility
      // First try trainer_id
      const trainerClassesByTrainerIdQuery = supabaseAdmin
        .from('classes')
        .select('id')
        .eq('trainer_id', trainerData.id)
      const { data: trainerClassesByTrainerId } = await trainerClassesByTrainerIdQuery
      
      // Also check if there's an instructor record for this trainer
      const { data: instructor } = await supabaseAdmin
        .from('instructors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      
      let trainerClassesByInstructorId: any[] = []
      if (instructor) {
        const instructorClassesQuery = supabaseAdmin
          .from('classes')
          .select('id')
          .eq('instructor_id', instructor.id)
        const { data: classesByInstructor } = await instructorClassesQuery
        trainerClassesByInstructorId = classesByInstructor || []
      }
      
      // Combine both results
      const allTrainerClassIds = [
        ...(trainerClassesByTrainerId?.map(c => c.id) || []),
        ...(trainerClassesByInstructorId.map(c => c.id))
      ]
      const uniqueClassIds = [...new Set(allTrainerClassIds)]
      
      if (uniqueClassIds.length > 0) {
        classesQuery = classesQuery.in('id', uniqueClassIds)
        enrollmentsQuery = enrollmentsQuery.in('class_id', uniqueClassIds)
        attendanceQuery = attendanceQuery.in('class_id', uniqueClassIds)
        
        const { data: enrollments } = await supabaseAdmin
          .from('class_enrollments')
          .select('client_id')
          .in('class_id', uniqueClassIds)
        
        const clientIds = [...new Set(enrollments?.map(e => e.client_id) || [])]
        if (clientIds.length > 0) {
          paymentsQuery = paymentsQuery.in('client_id', clientIds)
        } else {
          paymentsQuery = paymentsQuery.eq('client_id', 'none')
        }
      } else {
        classesQuery = classesQuery.eq('id', 'none')
        enrollmentsQuery = enrollmentsQuery.eq('class_id', 'none')
        attendanceQuery = attendanceQuery.eq('class_id', 'none')
        paymentsQuery = paymentsQuery.eq('client_id', 'none')
      }
    }

    // Fetch all data with error handling
    const [classesRes, enrollmentsRes, attendanceRes, paymentsRes] = await Promise.all([
      classesQuery,
      enrollmentsQuery,
      attendanceQuery,
      paymentsQuery
    ])

    // Handle query errors gracefully
    if (classesRes.error) {
      console.error('Error fetching classes:', classesRes.error)
    }
    if (enrollmentsRes.error) {
      console.error('Error fetching enrollments:', enrollmentsRes.error)
    }
    if (attendanceRes.error) {
      console.error('Error fetching attendance:', attendanceRes.error)
    }
    if (paymentsRes.error) {
      console.error('Error fetching payments:', paymentsRes.error)
    }

    const allClasses = (classesRes.data || []) as ClassData[]
    const allEnrollments = (enrollmentsRes.data || []) as EnrollmentData[]
    const allAttendance = (attendanceRes.data || []) as AttendanceData[]
    const allPayments = (paymentsRes.data || []) as PaymentData[]

    // Filter data by date range for analysis
    const classes = allClasses.filter(cls => {
      const classDate = cls.date
      return classDate >= startDateStr && classDate <= endDateStr
    })
    
    const enrollments = allEnrollments.filter(enroll => {
      const enrollDate = format(parseISO(enroll.created_at), 'yyyy-MM-dd')
      return enrollDate >= startDateStr && enrollDate <= endDateStr
    })
    
    const attendance = allAttendance.filter(att => {
      return att.date >= startDateStr && att.date <= endDateStr
    })
    
    const payments = allPayments.filter(payment => {
      if (!payment.paid_date) return false
      return payment.paid_date >= startDateStr && payment.paid_date <= endDateStr
    })

    // Get trainers - use trainers table directly (not instructors)
    const trainersQuery = userRole.role === 'admin' ? 
      supabaseAdmin.from('trainers').select('id, first_name, last_name, user_id, email') :
      supabaseAdmin.from('trainers').select('id, first_name, last_name, user_id, email').eq('user_id', user.id)
    
    const { data: trainers, error: trainersError } = await trainersQuery
    
    if (trainersError) {
      console.error('Error fetching trainers:', trainersError)
    }
    
    // Create trainer map by ID for direct lookup
    const trainerMap = new Map(trainers?.map(t => [t.id, t]) || [])
    
    // Also create a map by user_id for trainer lookup
    const trainerByUserIdMap = new Map(trainers?.map(t => [t.user_id, t]) || [])
    
    // Debug logging
    console.log('Trainers fetched:', trainers?.length || 0)
    if (trainers && trainers.length > 0) {
      console.log('Sample trainer:', trainers[0])
    }
    console.log('Trainer map size:', trainerMap.size)
    
    // Log unique trainer IDs from classes
    const classTrainerIds = [...new Set(
      allClasses
        .map(cls => (cls as any).trainer_id || cls.instructor_id)
        .filter(id => id !== null && id !== undefined)
    )]
    console.log('Unique trainer/instructor IDs from classes:', classTrainerIds.length, classTrainerIds)

    // ===== OPERATIONAL TRENDS =====

    // Attendance trends
    const attendanceByDate = new Map<string, { present: number; total: number }>()
    attendance.forEach(att => {
      const date = att.date
      if (!attendanceByDate.has(date)) {
        attendanceByDate.set(date, { present: 0, total: 0 })
      }
      const stats = attendanceByDate.get(date)!
      stats.total++
      if (att.status === 'present') stats.present++
    })

    const attendanceDaily = Array.from(attendanceByDate.entries())
      .map(([date, stats]) => ({
        date: format(parseISO(date), 'MMM dd'),
        attendance: stats.total > 0 ? (stats.present / stats.total) * 100 : 0,
        present: stats.present,
        total: stats.total
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Enrollment trends
    const enrollmentByDate = new Map<string, number>()
    enrollments.forEach(enroll => {
      const date = format(parseISO(enroll.created_at), 'yyyy-MM-dd')
      enrollmentByDate.set(date, (enrollmentByDate.get(date) || 0) + 1)
    })

    const enrollmentDaily = Array.from(enrollmentByDate.entries())
      .map(([date, count]) => ({
        date: format(parseISO(date), 'MMM dd'),
        enrollments: count
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Revenue trends
    const revenueByDate = new Map<string, number>()
    payments.forEach(payment => {
      if (payment.paid_date) {
        const date = payment.paid_date
        revenueByDate.set(date, (revenueByDate.get(date) || 0) + Number(payment.amount || 0))
      }
    })

    const revenueDaily = Array.from(revenueByDate.entries())
      .map(([date, amount]) => ({
        date: format(parseISO(date), 'MMM dd'),
        revenue: amount
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Class utilization by hour (use all classes for accurate patterns)
    const utilizationByHour = new Map<number, { total: number; enrolled: number }>()
    allClasses.forEach(cls => {
      if (cls.start_time) {
        const hour = extractHour(cls.start_time)
        if (!utilizationByHour.has(hour)) {
          utilizationByHour.set(hour, { total: 0, enrolled: 0 })
        }
        const stats = utilizationByHour.get(hour)!
        stats.total++
        stats.enrolled += cls.current_enrollment || 0
      }
    })

    const classUtilizationByHour = Array.from(utilizationByHour.entries())
      .map(([hour, stats]) => ({
        hour: `${hour}:00`,
        utilization: stats.total > 0 ? (stats.enrolled / (stats.total * 8)) * 100 : 0, // Assuming avg capacity of 8
        classes: stats.total
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))

    // Get unique trainer IDs from classes to ensure we have all needed data
    // Classes may use trainer_id or instructor_id - we'll handle both
    const uniqueTrainerIds = [...new Set(
      allClasses
        .map(cls => (cls as any).trainer_id || cls.instructor_id)
        .filter(id => id !== null && id !== undefined)
    )] as string[]
    
    // Fetch any missing trainers that weren't in our initial query
    const missingTrainerIds = uniqueTrainerIds.filter(id => !trainerMap.has(id))
    if (missingTrainerIds.length > 0) {
      const { data: missingTrainers } = await supabaseAdmin
        .from('trainers')
        .select('id, first_name, last_name, user_id, email')
        .in('id', missingTrainerIds)
      
      missingTrainers?.forEach(trainer => {
        trainerMap.set(trainer.id, trainer)
        if (trainer.user_id) {
          trainerByUserIdMap.set(trainer.user_id, trainer)
        }
      })
      
      // Also check if any are instructors that need to be mapped to trainers
      const { data: instructors } = await supabaseAdmin
        .from('instructors')
        .select('id, first_name, last_name, user_id, email')
        .in('id', missingTrainerIds)
      
      // Map instructors to trainers by user_id
      instructors?.forEach(instructor => {
        if (instructor.user_id) {
          const trainer = trainerByUserIdMap.get(instructor.user_id)
          if (trainer) {
            // Map instructor ID to trainer for lookup
            trainerMap.set(instructor.id, trainer)
          } else {
            // If no trainer found, use instructor data directly
            trainerMap.set(instructor.id, {
              id: instructor.id,
              first_name: instructor.first_name,
              last_name: instructor.last_name,
              user_id: instructor.user_id,
              email: instructor.email
            })
          }
        }
      })
    }

    // Trainer performance - map via instructor_id (use all classes)
    const trainerPerformance = new Map<string, { 
      name: string
      classes: number
      cancellations: number
      attendance: number
      totalAttendance: number
    }>()

    allClasses.forEach(cls => {
      // Try trainer_id first (primary), then instructor_id as fallback
      const trainerId = (cls as any).trainer_id || cls.instructor_id
      if (trainerId) {
        const trainer = trainerMap.get(trainerId)
        
        // Determine name from trainer data
        let trainerName = 'Unknown'
        if (trainer && trainer.first_name && trainer.last_name) {
          trainerName = `${trainer.first_name} ${trainer.last_name}`
        } else {
          // If still unknown, log for debugging
          console.warn(`Could not determine name for trainer ID: ${trainerId}, class: ${cls.id}, class name: ${cls.name}`)
        }
        
        // Use trainer ID as key
        const key = trainerId
        
        if (!trainerPerformance.has(key)) {
          trainerPerformance.set(key, {
            name: trainerName,
            classes: 0,
            cancellations: 0,
            attendance: 0,
            totalAttendance: 0
          })
        }
        const perf = trainerPerformance.get(key)!
        perf.classes++
        if (cls.status === 'cancelled') perf.cancellations++
      } else {
        // Log classes without trainer_id or instructor_id for debugging
        console.warn(`Class ${cls.id} (${cls.name}) has no trainer_id or instructor_id`)
      }
    })

    allAttendance.forEach(att => {
      const cls = allClasses.find(c => c.id === att.class_id)
      if (cls) {
        const trainerId = (cls as any).trainer_id || cls.instructor_id
        if (trainerId) {
          // Use trainerId as key (consistent with above)
          const key = trainerId
          const perf = trainerPerformance.get(key)
          if (perf) {
            perf.totalAttendance++
            if (att.status === 'present') perf.attendance++
          }
        }
      }
    })

    const trainerPerformanceArray = Array.from(trainerPerformance.values())
      .map(perf => ({
        ...perf,
        cancellationRate: perf.classes > 0 ? (perf.cancellations / perf.classes) * 100 : 0,
        attendanceRate: perf.totalAttendance > 0 ? (perf.attendance / perf.totalAttendance) * 100 : 0
      }))

    // ===== CANCELLATION HOTSPOTS =====
    // Use ALL classes for hotspot analysis to get accurate patterns
    // (not just date-filtered ones)

    // Cancellations by time of day
    const cancellationsByHour = new Map<number, { total: number; cancelled: number }>()
    allClasses.forEach(cls => {
      if (cls.start_time) {
        const hour = extractHour(cls.start_time)
        if (!cancellationsByHour.has(hour)) {
          cancellationsByHour.set(hour, { total: 0, cancelled: 0 })
        }
        const stats = cancellationsByHour.get(hour)!
        stats.total++
        if (cls.status === 'cancelled') stats.cancelled++
      }
    })

    const cancellationByTimeOfDay = Array.from(cancellationsByHour.entries())
      .map(([hour, stats]) => ({
        hour: `${hour}:00`,
        cancellationRate: stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0,
        total: stats.total,
        cancelled: stats.cancelled
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))

    // Cancellations by day of week
    const cancellationsByDay = new Map<string, { total: number; cancelled: number }>()
    allClasses.forEach(cls => {
      const dayName = getDayName(cls.date)
      if (!cancellationsByDay.has(dayName)) {
        cancellationsByDay.set(dayName, { total: 0, cancelled: 0 })
      }
      const stats = cancellationsByDay.get(dayName)!
      stats.total++
      if (cls.status === 'cancelled') stats.cancelled++
    })

    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const cancellationByDayOfWeek = dayOrder
      .filter(day => cancellationsByDay.has(day))
      .map(day => {
        const stats = cancellationsByDay.get(day)!
        return {
          day,
          cancellationRate: stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0,
          total: stats.total,
          cancelled: stats.cancelled
        }
      })

    // Cancellations by class type
    const cancellationsByType = new Map<string, { total: number; cancelled: number }>()
    allClasses.forEach(cls => {
      const type = cls.class_type || 'unknown'
      if (!cancellationsByType.has(type)) {
        cancellationsByType.set(type, { total: 0, cancelled: 0 })
      }
      const stats = cancellationsByType.get(type)!
      stats.total++
      if (cls.status === 'cancelled') stats.cancelled++
    })

    const cancellationByClassType = Array.from(cancellationsByType.entries())
      .map(([type, stats]) => ({
        type,
        cancellationRate: stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0,
        total: stats.total,
        cancelled: stats.cancelled
      }))

    // Cancellations by trainer - use trainer_id directly (use all classes)
    const cancellationsByTrainer = new Map<string, { name: string; total: number; cancelled: number }>()
    allClasses.forEach(cls => {
      const trainerId = (cls as any).trainer_id || cls.instructor_id
      if (trainerId) {
        const trainer = trainerMap.get(trainerId)
        
        // Determine name from trainer data
        let trainerName = 'Unknown'
        if (trainer && trainer.first_name && trainer.last_name) {
          trainerName = `${trainer.first_name} ${trainer.last_name}`
        }
        
        // Use trainerId as key
        const key = trainerId
        if (!cancellationsByTrainer.has(key)) {
          cancellationsByTrainer.set(key, { name: trainerName, total: 0, cancelled: 0 })
        }
        const stats = cancellationsByTrainer.get(key)!
        stats.total++
        if (cls.status === 'cancelled') stats.cancelled++
      }
    })

    const cancellationByTrainer = Array.from(cancellationsByTrainer.values())
      .map(stats => ({
        trainer: stats.name,
        cancellationRate: stats.total > 0 ? (stats.cancelled / stats.total) * 100 : 0,
        total: stats.total,
        cancelled: stats.cancelled
      }))
      .sort((a, b) => b.cancellationRate - a.cancellationRate)

    // Enrollment cancellations (cancelled enrollments)
    const cancelledEnrollments = enrollments.filter(e => e.status === 'cancelled')
    const enrollmentCancellationsByClient = new Map<string, number>()
    cancelledEnrollments.forEach(enroll => {
      enrollmentCancellationsByClient.set(
        enroll.client_id,
        (enrollmentCancellationsByClient.get(enroll.client_id) || 0) + 1
      )
    })

    const topCancellationClients = Array.from(enrollmentCancellationsByClient.entries())
      .map(([clientId, count]) => ({ clientId, cancellations: count }))
      .sort((a, b) => b.cancellations - a.cancellations)
      .slice(0, 10)

    // Calculate time before class when cancelled (for enrollments)
    const cancellationTiming: number[] = []
    cancelledEnrollments.forEach(enroll => {
      const cls = allClasses.find(c => c.id === enroll.class_id)
      if (cls && cls.date && enroll.updated_at) {
        const classDate = parseISO(cls.date)
        const cancelDate = parseISO(enroll.updated_at)
        const hoursBefore = (classDate.getTime() - cancelDate.getTime()) / (1000 * 60 * 60)
        if (hoursBefore > 0 && hoursBefore < 720) { // Within 30 days
          cancellationTiming.push(hoursBefore)
        }
      }
    })

    const avgHoursBeforeCancellation = cancellationTiming.length > 0
      ? cancellationTiming.reduce((a, b) => a + b, 0) / cancellationTiming.length
      : 0

    // ===== INSIGHTS & RECOMMENDATIONS =====

    const insights: string[] = []
    const recommendations: string[] = []
    const warnings: string[] = []

    // Analyze cancellation hotspots
    const maxCancellationHour = cancellationByTimeOfDay.reduce((max, item) => 
      item.cancellationRate > max.cancellationRate ? item : max, 
      cancellationByTimeOfDay[0] || { hour: '', cancellationRate: 0 }
    )
    if (maxCancellationHour.cancellationRate > 20) {
      warnings.push(`High cancellation rate (${maxCancellationHour.cancellationRate.toFixed(1)}%) at ${maxCancellationHour.hour}`)
      recommendations.push(`Consider reviewing classes scheduled at ${maxCancellationHour.hour} - may need better communication or scheduling adjustments`)
    }

    const maxCancellationDay = cancellationByDayOfWeek.reduce((max, item) => 
      item.cancellationRate > max.cancellationRate ? item : max,
      cancellationByDayOfWeek[0] || { day: '', cancellationRate: 0 }
    )
    if (maxCancellationDay.cancellationRate > 20) {
      insights.push(`${maxCancellationDay.day} has the highest cancellation rate (${maxCancellationDay.cancellationRate.toFixed(1)}%)`)
    }

    // Trainer performance insights
    const trainerWithHighCancellations = cancellationByTrainer.find(t => t.cancellationRate > 25)
    if (trainerWithHighCancellations) {
      warnings.push(`${trainerWithHighCancellations.trainer} has a high cancellation rate (${trainerWithHighCancellations.cancellationRate.toFixed(1)}%)`)
      recommendations.push(`Review scheduling and communication with ${trainerWithHighCancellations.trainer}`)
    }

    // Attendance insights
    const avgAttendanceRate = attendanceDaily.length > 0
      ? attendanceDaily.reduce((sum, day) => sum + day.attendance, 0) / attendanceDaily.length
      : 0
    if (avgAttendanceRate < 70) {
      warnings.push(`Low average attendance rate: ${avgAttendanceRate.toFixed(1)}%`)
      recommendations.push('Consider implementing reminder systems or incentives to improve attendance')
    } else if (avgAttendanceRate > 85) {
      insights.push(`Excellent attendance rate: ${avgAttendanceRate.toFixed(1)}%`)
    }

    // Revenue insights
    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const avgDailyRevenue = revenueDaily.length > 0
      ? revenueDaily.reduce((sum, day) => sum + day.revenue, 0) / revenueDaily.length
      : 0
    if (avgDailyRevenue > 0) {
      insights.push(`Average daily revenue: $${avgDailyRevenue.toFixed(2)}`)
    }

    // Cancellation timing insight
    if (avgHoursBeforeCancellation > 0) {
      const daysBefore = (avgHoursBeforeCancellation / 24).toFixed(1)
      insights.push(`Average cancellation occurs ${daysBefore} days before scheduled class`)
      if (avgHoursBeforeCancellation < 24) {
        warnings.push('Many cancellations occur less than 24 hours before class - consider implementing cancellation policies')
      }
    }

    return NextResponse.json({
      operationalTrends: {
        attendance: {
          daily: attendanceDaily,
          averageRate: avgAttendanceRate
        },
        enrollment: {
          daily: enrollmentDaily,
          total: enrollments.length,
          active: enrollments.filter(e => e.status === 'active').length,
          cancelled: cancelledEnrollments.length
        },
        revenue: {
          daily: revenueDaily,
          total: totalRevenue,
          averageDaily: avgDailyRevenue
        },
        classUtilization: {
          byHour: classUtilizationByHour,
          averageOccupancy: classes.length > 0
            ? classes.reduce((sum, c) => sum + (c.current_enrollment || 0), 0) / 
              classes.reduce((sum, c) => sum + (c.max_capacity || 8), 0) * 100
            : 0
        },
        trainerPerformance: trainerPerformanceArray
      },
      cancellationHotspots: {
        byTimeOfDay: cancellationByTimeOfDay,
        byDayOfWeek: cancellationByDayOfWeek,
        byClassType: cancellationByClassType,
        byTrainer: cancellationByTrainer,
        byClient: topCancellationClients,
        averageHoursBeforeClass: avgHoursBeforeCancellation
      },
      insights: {
        recommendations,
        warnings,
        insights
      },
      summary: {
        totalClasses: allClasses.length, // Use all classes for summary
        cancelledClasses: allClasses.filter(c => c.status === 'cancelled').length,
        totalEnrollments: allEnrollments.length, // Use all enrollments
        cancelledEnrollments: allEnrollments.filter(e => e.status === 'cancelled').length,
        overallCancellationRate: allClasses.length > 0
          ? (allClasses.filter(c => c.status === 'cancelled').length / allClasses.length) * 100
          : 0,
        dateRange: {
          start: startDateStr,
          end: endDateStr,
          days: days
        }
      }
    })
  } catch (error) {
    console.error('Error fetching insights data:', error)
    
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error instanceof Error ? error.message : 'Unknown error')
      : 'Failed to fetch insights data'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}



