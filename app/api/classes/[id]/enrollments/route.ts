import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// GET /api/classes/[id]/enrollments - Get enrollments for a class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check user role
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

    // Fetch enrollments with client information
    const { data: enrollments, error } = await supabaseAdmin
      .from('class_enrollments')
      .select(`
        *,
        client:clients(id, first_name, last_name, email, phone)
      `)
      .eq('class_id', id)
      .eq('status', 'enrolled')

    if (error) {
      console.error('Error fetching enrollments:', error)
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
    }

    return NextResponse.json(enrollments || [])
  } catch (error) {
    console.error('Error in enrollments API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/classes/[id]/enrollments - Enroll a student in a class
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check user role
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

    const { client_id } = await request.json()

    if (!client_id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 })
    }

    // Check if class exists and has capacity
    const { data: classData, error: classError } = await supabaseAdmin
      .from('classes')
      .select('id, max_capacity')
      .eq('id', id)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Check current enrollment count
    const { data: currentEnrollments, error: countError } = await supabaseAdmin
      .from('class_enrollments')
      .select('id')
      .eq('class_id', id)
      .eq('status', 'enrolled')

    if (countError) {
      return NextResponse.json({ error: 'Failed to check enrollment capacity' }, { status: 500 })
    }

    if (currentEnrollments && currentEnrollments.length >= classData.max_capacity) {
      return NextResponse.json({ error: 'Class is at full capacity' }, { status: 400 })
    }

    // Check if client is already enrolled
    const { data: existingEnrollment, error: existingError } = await supabaseAdmin
      .from('class_enrollments')
      .select('id')
      .eq('class_id', id)
      .eq('client_id', client_id)
      .eq('status', 'enrolled')
      .single()

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Client is already enrolled in this class' }, { status: 400 })
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('class_enrollments')
      .insert({
        class_id: id,
        client_id,
        status: 'enrolled',
        enrollment_date: new Date().toISOString()
      })
      .select(`
        *,
        client:clients(id, first_name, last_name, email, phone)
      `)
      .single()

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError)
      return NextResponse.json({ error: 'Failed to enroll student' }, { status: 500 })
    }

    return NextResponse.json(enrollment)
  } catch (error) {
    console.error('Error in enrollment creation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
