import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  req: NextRequest,
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
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || !userRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    // Only allow admin and trainer access
    if (!['admin', 'trainer'].includes(userRole.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // TODO: Implement actual subscription fetching
    // For now, return mock data
    const mockSubscription = {
      id: id,
      client_id: 'mock_client_id',
      plan_name: 'Monthly Swimming',
      status: 'active',
      start_date: new Date().toISOString(),
      amount: 100,
      billing_frequency: 'monthly',
      sessions_remaining: 15,
      sessions_total: 20,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(mockSubscription)

  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
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
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || !userRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    // Only allow admin and trainer access
    if (!['admin', 'trainer'].includes(userRole.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()
    
    // TODO: Implement actual subscription update
    // For now, return mock data
    const updatedSubscription = {
      id: id,
      ...body,
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(updatedSubscription)

  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
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
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || !userRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    // Only allow admin and trainer access
    if (!['admin', 'trainer'].includes(userRole.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // TODO: Implement actual subscription deletion
    // For now, return success
    return NextResponse.json({ message: 'Subscription deleted successfully' })

  } catch (error) {
    console.error('Error deleting subscription:', error)
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    )
  }
}
