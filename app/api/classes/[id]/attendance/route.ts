import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// GET /api/classes/[id]/attendance - Get attendance for a class
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

    // Fetch attendance records
    const { data: attendance, error } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('class_id', id)

    if (error) {
      console.error('Error fetching attendance:', error)
      return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
    }

    return NextResponse.json(attendance || [])
  } catch (error) {
    console.error('Error in attendance API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/classes/[id]/attendance - Mark attendance for a student
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

    const { client_id, status } = await request.json()

    if (!client_id || !status) {
      return NextResponse.json({ error: 'Client ID and status are required' }, { status: 400 })
    }

    if (!['present', 'absent', 'late'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be present, absent, or late' }, { status: 400 })
    }

    // Check if attendance record already exists
    const { data: existingAttendance, error: existingError } = await supabaseAdmin
      .from('attendance')
      .select('id')
      .eq('class_id', id)
      .eq('client_id', client_id)
      .single()

    let attendanceRecord;

    if (existingAttendance) {
      // Update existing record
      const { data, error: updateError } = await supabaseAdmin
        .from('attendance')
        .update({
          status,
          marked_at: new Date().toISOString(),
          marked_by: user.id
        })
        .eq('id', existingAttendance.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating attendance:', updateError)
        return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 })
      }

      attendanceRecord = data
    } else {
      // Create new record
      const { data, error: createError } = await supabaseAdmin
        .from('attendance')
        .insert({
          class_id: id,
          client_id,
          status,
          marked_at: new Date().toISOString(),
          marked_by: user.id
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating attendance:', createError)
        return NextResponse.json({ error: 'Failed to create attendance record' }, { status: 500 })
      }

      attendanceRecord = data
    }

    return NextResponse.json(attendanceRecord)
  } catch (error) {
    console.error('Error in attendance creation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
