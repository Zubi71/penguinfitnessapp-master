import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'active'
    const eventType = searchParams.get('eventType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Build query
    let query = supabase
      .from('community_events')
      .select('*')
      .eq('status', status)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true })
      .range(offset, offset + limit - 1)
    
    // Add event type filter if provided
    if (eventType) {
      query = query.eq('event_type', eventType)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching community events:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }
    
    return NextResponse.json({ events: data })
  } catch (error) {
    console.error('Error in GET /api/community-events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is trainer or admin
    const userRole = user.user_metadata?.role
    if (userRole !== 'trainer' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['title', 'event_date', 'start_time', 'end_time', 'location']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }
    
    // Create event
    const { data, error } = await supabase
      .from('community_events')
      .insert([{
        title: body.title,
        description: body.description,
        event_date: body.event_date,
        start_time: body.start_time,
        end_time: body.end_time,
        location: body.location,
        max_participants: body.max_participants,
        event_type: body.event_type || 'community',
        difficulty_level: body.difficulty_level || 'all',
        price: body.price || 0.00,
        image_url: body.image_url,
        created_by: user.id,
        status: body.status || 'active',
        is_featured: body.is_featured || false
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating community event:', error)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }
    
    return NextResponse.json({ event: data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/community-events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
