import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's registrations
    const { data: registrations, error } = await supabase
      .from('community_event_participants')
      .select(`
        id,
        event_id,
        status,
        registration_date,
        invoice_id
      `)
      .eq('user_id', user.id)
      .order('registration_date', { ascending: false })

    if (error) {
      console.error('Error fetching user registrations:', error)
      return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
    }

    return NextResponse.json({ registrations: registrations || [] })
  } catch (error) {
    console.error('Error in GET /api/community-events/user-registrations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
