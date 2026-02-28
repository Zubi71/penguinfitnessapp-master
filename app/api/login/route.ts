import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body
    const cookieStore = await cookies()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Create SSR client for authentication
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Attempt to sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    })

    if (error) {
      console.error('Login error:', error.message)
      
      // Return generic error message for security
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Check if user has the correct role - handle multiple roles gracefully
    const { data: userRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role, id')
      .eq('user_id', data.user.id)
      .order('id', { ascending: false }) // Get most recent first

    if (roleError) {
      console.error('Role check error:', roleError.message)
      return NextResponse.json(
        { error: 'Failed to fetch user role' },
        { status: 500 }
      )
    }

    if (!userRoles || userRoles.length === 0) {
      console.error('No role found for user:', data.user.id)
      return NextResponse.json(
        { error: 'User role not found' },
        { status: 403 }
      )
    }

    // If multiple roles, clean them up and use the most recent one
    if (userRoles.length > 1) {
      console.warn(`User ${data.user.id} has ${userRoles.length} roles, cleaning up...`)
      
      // Keep the most recent role (first in the ordered list)
      const keepRole = userRoles[0]
      const deleteRoles = userRoles.slice(1)

      // Delete duplicate roles
      for (const role of deleteRoles) {
        await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('id', role.id)
      }

      console.log(`Cleaned up ${deleteRoles.length} duplicate roles for user ${data.user.id}`)
    }

    const userRole = userRoles[0]

    // Get user profile information
    const { data: clientProfile, error: profileError } = await supabaseAdmin
      .from('client_signups')
      .select('first_name, last_name, email, phone')
      .eq('email', email.toLowerCase().trim())
      .single()

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userRole.role,
        profile: clientProfile || null
      },
      session: {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_at: data.session?.expires_at
      }
    })

    // Log successful login (without sensitive data)
    console.log(`Successful login for user: ${data.user.email}`)

    return response

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle logout
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Create SSR client for logout
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Sign out from Supabase
    await supabase.auth.signOut()

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

    return response

  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
