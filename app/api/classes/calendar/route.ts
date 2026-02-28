import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// GET /api/classes/calendar - Get classes for calendar view
export async function GET(request: NextRequest) {
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

    // Create admin client for operations
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

    // Only allow admin and trainer access
    if (userRole.role !== 'admin' && userRole.role !== 'trainer') {
      return NextResponse.json({ 
        error: 'Access denied. Admin or trainer role required.' 
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const instructor_id = searchParams.get('instructor_id')

    let query = supabaseAdmin
      .from('classes')
      .select(`
        *,
        instructor:instructors(id, first_name, last_name, email)
      `)

    // Apply date range filter if provided
    if (startDate && endDate) {
      query = query
        .gte('date', startDate)
        .lte('date', endDate)
    }

    // Apply instructor filter if provided
    if (instructor_id) {
      query = query.eq('instructor_id', instructor_id)
    }

    const { data: classes, error } = await query.order('date', { ascending: true })

    if (error) {
      console.error('Error fetching calendar classes:', error)
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch classes',
        details: error.message 
      }, { status: 500 })
    }

    console.log(`📅 Found ${classes?.length || 0} classes for calendar view`)
    
    if (!classes || classes.length === 0) {
      return NextResponse.json({
        success: true,
        events: [],
        total: 0,
        message: 'No classes found for the specified date range'
      })
    }

    // Transform classes to calendar events format
    const calendarEvents = (classes || [])
      .map(classData => {
        // Validate required fields
        if (!classData.date || !classData.start_time || !classData.end_time) {
          console.warn(`Skipping class ${classData.id}: Missing date/time data`, {
            date: classData.date,
            start_time: classData.start_time,
            end_time: classData.end_time
          })
          return null
        }

        const startDateTime = new Date(`${classData.date}T${classData.start_time}`)
        const endDateTime = new Date(`${classData.date}T${classData.end_time}`)
        
        // Validate dates are valid
        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          console.warn(`Skipping class ${classData.id}: Invalid date/time values`, {
            date: classData.date,
            start_time: classData.start_time,
            end_time: classData.end_time,
            startDateTime: startDateTime.toString(),
            endDateTime: endDateTime.toString()
          })
          return null
        }

        // Additional validation: ensure start time is before end time
        if (startDateTime >= endDateTime) {
          console.warn(`Skipping class ${classData.id}: Start time is not before end time`, {
            startDateTime: startDateTime.toString(),
            endDateTime: endDateTime.toString()
          })
          return null
        }
        
        // Determine event color based on status
        let variant = 'primary'
        switch (classData.status) {
          case 'scheduled':
            variant = 'primary'
            break
          case 'in_progress':
            variant = 'warning'
            break
          case 'completed':
            variant = 'success'
            break
          case 'cancelled':
            variant = 'danger'
            break
          default:
            variant = 'primary'
        }

        return {
          id: classData.id,
          title: classData.name || 'Untitled Class',
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          variant,
          classData: {
            ...classData,
            instructor_name: classData.instructor 
              ? `${classData.instructor.first_name} ${classData.instructor.last_name}`
              : 'No instructor',
            enrollment_count: 0, // TODO: Fetch from class_enrollments table
            enrolled_clients: []
          }
        }
      })
      .filter(event => event !== null) // Remove invalid events

    console.log(`📅 Transformed ${calendarEvents.length} valid events out of ${classes.length} classes`)

    return NextResponse.json({
      success: true,
      events: calendarEvents,
      total: calendarEvents.length
    })
  } catch (error) {
    console.error('Error in calendar classes API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
