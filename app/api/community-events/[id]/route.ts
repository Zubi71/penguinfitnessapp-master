import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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
    
    const { data, error } = await supabase
      .from('community_events')
      .select(`
        *,
        created_by_user:auth.users!community_events_created_by_fkey(
          id,
          email,
          raw_user_meta_data
        ),
        participants:community_event_participants(
          id,
          user_id,
          registration_date,
          status,
          notes,
          user:auth.users(
            id,
            email,
            raw_user_meta_data
          )
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching community event:', error)
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    return NextResponse.json({ event: data })
  } catch (error) {
    console.error('Error in GET /api/community-events/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Check if user is the creator of the event
    const { data: existingEvent, error: fetchError } = await supabase
      .from('community_events')
      .select('created_by')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    if (existingEvent.created_by !== user.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    // Update event
    const { data, error } = await supabase
      .from('community_events')
      .update({
        title: body.title,
        description: body.description,
        event_date: body.event_date,
        start_time: body.start_time,
        end_time: body.end_time,
        location: body.location,
        max_participants: body.max_participants,
        event_type: body.event_type,
        difficulty_level: body.difficulty_level,
        price: body.price,
        image_url: body.image_url,
        status: body.status,
        is_featured: body.is_featured,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating community event:', error)
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }
    
    return NextResponse.json({ event: data })
  } catch (error) {
    console.error('Error in PUT /api/community-events/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is the creator of the event
    const { data: existingEvent, error: fetchError } = await supabase
      .from('community_events')
      .select('created_by')
      .eq('id', id)
      .single()
    
    if (fetchError || !existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    
    if (existingEvent.created_by !== user.id) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    // Delete event (participants will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('community_events')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting community event:', error)
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/community-events/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
