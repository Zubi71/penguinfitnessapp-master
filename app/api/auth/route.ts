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

    // Create admin client for role queries
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get session user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user role (using admin client to bypass RLS)
    const { data: userRoleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    if (roleError) {
      console.error('Role fetch error:', roleError)
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    // Fetch profile (clients or instructors) using admin client
    let profile: any = null
    if (userRoleData.role === 'client') {
      const { data: clientProfile } = await supabaseAdmin
        .from('client_signups')
        .select('first_name, last_name, email, phone')
        .eq('email', user.email!) // supabase user email
        .single()
      profile = clientProfile
    } else if (userRoleData.role === 'trainer') {
      const { data: trainerProfile } = await supabaseAdmin
        .from('trainers')
        .select('first_name, last_name, email, phone')
        .eq('user_id', user.id)
        .single()
      profile = trainerProfile
    } else {
      const { data: generalProfile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', user.id)
        .single()
      profile = generalProfile
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: userRoleData.role,
        profile
      }
    })
  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
