import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth-middleware'

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Only trainers and admins can search for users
    if (req.user.role !== 'trainer' && req.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Create admin client to search for users
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // First, check if user exists in auth.users and has client role
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      )
    }

    const foundAuthUser = authUsers.users.find(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    )

    if (!foundAuthUser) {
      return NextResponse.json(
        { error: 'No user found with this email address' },
        { status: 404 }
      )
    }

    // Check if user has client role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', foundAuthUser.id)
      .single()

    if (roleError || !userRole || userRole.role !== 'client') {
      return NextResponse.json(
        { error: 'User found but not registered as a client' },
        { status: 404 }
      )
    }

    // Get client profile information
    const { data: clientProfile, error: profileError } = await supabaseAdmin
      .from('client_signups')
      .select('first_name, last_name, email, phone')
      .eq('email', email.toLowerCase())
      .single()

    if (profileError) {
      // Try to get from profiles table as fallback
      const { data: generalProfile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', foundAuthUser.id)
        .single()

      return NextResponse.json({
        user: {
          id: foundAuthUser.id,
          email: foundAuthUser.email,
          first_name: generalProfile?.first_name || '',
          last_name: generalProfile?.last_name || '',
          phone: generalProfile?.phone || ''
        }
      })
    }

    return NextResponse.json({
      user: {
        id: foundAuthUser.id,
        email: clientProfile.email,
        first_name: clientProfile.first_name,
        last_name: clientProfile.last_name,
        phone: clientProfile.phone
      }
    })

  } catch (error) {
    console.error('Search user API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
