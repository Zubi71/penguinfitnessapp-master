import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Admin client for privileged operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/trainers/[id] - Get a specific trainer
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

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    // Allow admin and trainer access
    if (!['admin', 'trainer'].includes(userRole.role)) {
      return NextResponse.json({ 
        error: 'Access denied. Admin or trainer role required.' 
      }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Database error fetching trainer:', error)
      return NextResponse.json({ error: 'Failed to fetch trainer' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in trainer GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/trainers/[id] - Update a trainer
export async function PUT(
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

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    // Only allow admin access for updating trainers
    if (userRole.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Access denied. Admin role required.' 
      }, { status: 403 })
    }

    const trainerData = await request.json()

    // Validate required fields
    if (!trainerData.first_name || !trainerData.last_name || !trainerData.email) {
      return NextResponse.json({ 
        error: 'Missing required fields: first_name, last_name, email' 
      }, { status: 400 })
    }

    // Update trainer using admin client
    const { data, error } = await supabaseAdmin
      .from('trainers')
      .update(trainerData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating trainer:', error)
      return NextResponse.json({ 
        error: `Failed to update trainer: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in trainer PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/trainers/[id] - Delete a trainer
export async function DELETE(
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

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    // Only allow admin access for deleting trainers
    if (userRole.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Access denied. Admin role required.' 
      }, { status: 403 })
    }

    // Delete trainer using admin client
    const { error } = await supabaseAdmin
      .from('trainers')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting trainer:', error)
      return NextResponse.json({ 
        error: `Failed to delete trainer: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ message: 'Trainer deleted successfully' })
  } catch (error) {
    console.error('Error in trainer DELETE API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
