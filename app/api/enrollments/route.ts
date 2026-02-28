import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// GET /api/enrollments - List all enrollments
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
      console.error('User role error:', roleError)
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    // Only allow admin and trainer access
    if (userRole.role !== 'admin' && userRole.role !== 'trainer') {
      return NextResponse.json({ 
        error: 'Access denied. Admin or trainer role required.' 
      }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const class_id = searchParams.get('class_id')
    const client_id = searchParams.get('client_id')

    // Build query to include invoice information
    let query = supabaseAdmin
      .from('class_enrollments')
      .select(`
        *,
        client:client_signups(id, first_name, last_name, email),
        class:classes(id, name, date, start_time, end_time),
        invoice:invoices(id, invoice_number, status, total_amount, stripe_invoice_id, created_at)
      `)
      .order('enrollment_date', { ascending: false })

    // Apply filters if provided
    if (class_id) {
      query = query.eq('class_id', class_id)
    }
    if (client_id) {
      query = query.eq('client_id', client_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching enrollments:', error)
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in enrollments API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/enrollments - Create a new enrollment
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

    // Only allow admin and trainer access for creating enrollments
    if (userRole.role !== 'admin' && userRole.role !== 'trainer') {
      return NextResponse.json({ 
        error: 'Access denied. Admin or trainer role required.' 
      }, { status: 403 })
    }

    const enrollmentData = await request.json()

    // Validate required fields
    if (!enrollmentData.client_id || !enrollmentData.class_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: client_id, class_id' 
      }, { status: 400 })
    }

    // Create enrollment using admin client
    const { data, error } = await supabaseAdmin
      .from('class_enrollments')
      .insert([enrollmentData])
      .select()
      .single()

    if (error) {
      console.error('Error creating enrollment:', error)
      return NextResponse.json({ 
        error: `Failed to create enrollment: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in enrollments POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}