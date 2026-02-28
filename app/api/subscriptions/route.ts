import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
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

    // Only allow admin access for subscription management
    if (userRole.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Access denied. Admin role required for subscription management.' 
      }, { status: 403 })
    }

    // For now, return mock data since we don't have a subscriptions table yet
    // In a real implementation, you would fetch from the database
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })

    if (clientsError) {
      throw clientsError
    }

    // Create mock subscriptions data
    const mockSubscriptions = clients.map((client, index) => ({
      id: `sub_${client.id}_${index}`,
      client_id: client.id,
      client: client,
      plan_name: ['Monthly Swimming', 'Weekly Training', 'Annual Membership'][index % 3],
      status: ['active', 'inactive', 'suspended'][index % 3],
      start_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      next_billing_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: [100, 150, 1000][index % 3],
      billing_frequency: ['monthly', 'weekly', 'annual'][index % 3],
      sessions_remaining: Math.floor(Math.random() * 20),
      sessions_total: 20,
      created_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      notes: `Training notes for ${client.first_name} ${client.last_name}`
    }))

    return NextResponse.json(mockSubscriptions)

  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
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

    // Only allow admin access for subscription creation
    if (userRole.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Access denied. Admin role required for subscription management.' 
      }, { status: 403 })
    }

    const body = await req.json()
    
    // TODO: Implement actual subscription creation
    // For now, return mock data
    const newSubscription = {
      id: `sub_${Date.now()}`,
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    return NextResponse.json(newSubscription, { status: 201 })

  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
