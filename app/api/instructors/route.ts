import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// GET /api/instructors - List all instructors
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

    // Fetch trainers using admin client (instructors table doesn't exist, use trainers instead)
    const { data, error } = await supabaseAdmin
      .from('trainers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching trainers (instructors API):', error)
      return NextResponse.json({ error: 'Failed to fetch trainers' }, { status: 500 })
    }

    console.log(`✅ Found ${data?.length || 0} trainers for user role: ${userRole.role}`)
    
    // Log each trainer for debugging
    if (data && data.length > 0) {
      console.log('📋 Trainer details (from instructors API):')
      data.forEach((trainer, index) => {
        console.log(`  ${index + 1}. ${trainer.first_name} ${trainer.last_name} (${trainer.email}) - Created: ${trainer.created_at}`)
      })
    } else {
      console.log('📋 No trainers found in database')
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in instructors API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/instructors - Create a new instructor
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

    // Only allow admin access for creating instructors
    if (userRole.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Access denied. Admin role required.' 
      }, { status: 403 })
    }

    const instructorData = await request.json()

    // Validate required fields
    if (!instructorData.first_name || !instructorData.last_name || !instructorData.email) {
      return NextResponse.json({ 
        error: 'Missing required fields: first_name, last_name, email' 
      }, { status: 400 })
    }

    // Create trainer using admin client (instructors table doesn't exist, use trainers instead)
    const { data, error } = await supabaseAdmin
      .from('trainers')
      .insert([instructorData])
      .select()
      .single()

    if (error) {
      console.error('Error creating trainer (instructors API):', error)
      return NextResponse.json({ 
        error: `Failed to create trainer: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in instructors POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
