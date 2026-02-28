import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client for server-side operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          },
        },
      }
    )

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user role
    const { data: userRoleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (roleError) {
      return NextResponse.json(
        { error: 'User role not found' },
        { status: 403 }
      )
    }

    // Get profile data based on role
    let profile: any = null
    if (userRoleData.role === 'client') {
      const { data: clientProfile } = await supabase
        .from('clients')
        .select('first_name, last_name, email, phone')
        .eq('email', user.email!)
        .single()
      profile = clientProfile
    } else {
      const { data: generalProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', user.id)
        .single()
      profile = generalProfile
    }

    const userData = {
      id: user.id,
      email: user.email,
      role: userRoleData.role,
      profile
    }

    return NextResponse.json({ user: userData })
  } catch (error) {
    console.error('Error in GET /api/auth/me:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
