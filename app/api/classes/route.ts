import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { z } from 'zod'

const classSchema = z.object({
  title: z.string().optional(),
  membership_type: z.string().optional(),
  name: z.string().min(1, 'Class name is required'),
  description: z.string().optional(),
  instructor_id: z.string().optional(),
  date: z.string().optional(), // Make date optional for now
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  duration_minutes: z.number().min(1, 'Duration must be at least 1 minute').optional(),
  max_capacity: z.number().min(1).optional(),
  current_enrollment: z.number().min(0).optional(),
  lessons_per_package: z.number().min(1).optional(),
  class_type: z.enum(['group', 'private', 'semi-private']).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'all']).optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  location: z.string().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  recurring: z.boolean().optional(),
  recurring_pattern: z.string().optional(),
  recurring_end_date: z.string().optional(),
  notes: z.string().optional()
})

// GET /api/classes - List all classes
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
    const instructor_id = searchParams.get('instructor_id')
    const date_range = searchParams.get('date_range')
    const status = searchParams.get('status')
    const orderBy = searchParams.get('orderBy') || 'date'

    // Fetch classes data - handle missing instructor relationship gracefully
    let query = supabaseAdmin.from('classes').select('*')

    // Apply filters
    if (instructor_id) {
      query = query.eq('instructor_id', instructor_id)
    }
    
    if (status) {
      query = query.eq('status', status)
    }

    if (date_range === 'today') {
      const today = new Date().toISOString().split('T')[0]
      query = query.eq('date', today)
    } else if (date_range === 'week') {
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      query = query
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', nextWeek.toISOString().split('T')[0])
    } else if (date_range === 'month') {
      const today = new Date()
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
      query = query
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', nextMonth.toISOString().split('T')[0])
    }

    // Order by date or other criteria
    if (orderBy === 'date') {
      query = query.order('date', { ascending: true }).order('start_time', { ascending: true })
    } else if (orderBy === 'created_at') {
      query = query.order('created_at', { ascending: false })
    }

    const { data: classes, error } = await query

    if (error) {
      console.error('Error fetching classes:', error)
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }

    // If we have classes, try to enrich them with trainer information
    let enrichedClasses = classes || []
    
    if (classes && classes.length > 0) {
      // Get unique instructor IDs
      const instructorIds = [...new Set(classes.map(c => c.instructor_id).filter(Boolean))]
      
      if (instructorIds.length > 0) {
        // Try to fetch trainer info for these IDs
        const { data: trainers } = await supabaseAdmin
          .from('trainers')
          .select('id, first_name, last_name, email')
          .in('id', instructorIds)
        
        if (trainers) {
          // Create a map of trainer ID to trainer info
          const trainerMap = new Map(trainers.map(t => [t.id, t]))
          
          // Enrich classes with trainer info
          enrichedClasses = classes.map(classItem => ({
            ...classItem,
            instructor: trainerMap.get(classItem.instructor_id) || null
          }))
        }
      }
    }

    return NextResponse.json(enrichedClasses)
  } catch (error) {
    console.error('Error in classes API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/classes - Create a new class
export async function POST(request: NextRequest) {
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

    // Only allow admin and trainer access for creating classes
    if (userRole.role !== 'admin' && userRole.role !== 'trainer') {
      return NextResponse.json({ 
        error: 'Access denied. Admin or trainer role required.' 
      }, { status: 403 })
    }

    const classData = await request.json()

    // Set default date if not provided
    if (!classData.date) {
      classData.date = new Date().toISOString().split('T')[0] // Today's date
    }

    // Validate with schema
    try {
      classSchema.parse(classData)
    } catch (validationError) {
      console.error('Class validation error:', validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({ 
          error: 'Validation failed',
          details: validationError.errors
        }, { status: 400 })
      }
      return NextResponse.json({ 
        error: 'Validation failed',
        details: validationError 
      }, { status: 400 })
    }

    // Create class using admin client
    const { data, error } = await supabaseAdmin
      .from('classes')
      .insert([classData])
      .select()
      .single()

    if (error) {
      console.error('Error creating class:', error)
      return NextResponse.json({ 
        error: `Failed to create class: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in classes POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
