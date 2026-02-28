import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
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
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in GET /api/community-events/public:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
