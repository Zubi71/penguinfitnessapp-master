import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth-middleware'

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json()
    const { clientEmail } = body

    if (!clientEmail) {
      return NextResponse.json(
        { error: 'Client email is required' },
        { status: 400 }
      )
    }

    // Only trainers and admins can add clients
    if (req.user.role !== 'trainer' && req.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Use the authenticated user's ID directly as trainer_id
    // since clients.trainer_id references auth.users(id)
    const trainerId = req.user.id

    // Create admin client
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

    // Find the client's auth user
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return NextResponse.json(
        { error: 'Failed to search users' },
        { status: 500 }
      )
    }

    const clientAuthUser = authUsers.users.find(user => 
      user.email?.toLowerCase() === clientEmail.toLowerCase()
    )

    if (!clientAuthUser) {
      return NextResponse.json(
        { error: 'Client user account not found' },
        { status: 404 }
      )
    }

    // Verify user has client role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', clientAuthUser.id)
      .single()

    if (roleError || !userRole || userRole.role !== 'client') {
      return NextResponse.json(
        { error: 'User is not registered as a client' },
        { status: 400 }
      )
    }

    // Check if client already exists globally (by email)
    const { data: globalClient } = await supabaseAdmin
      .from('clients')
      .select('id, trainer_id')
      .eq('email', clientEmail.toLowerCase())
      .maybeSingle()

    if (globalClient) {
      // If the client is already assigned to this trainer, return a specific error
      if (globalClient.trainer_id === trainerId) {
        return NextResponse.json(
          { error: 'This client is already in your client list' },
          { status: 409 }
        )
      } else {
        return NextResponse.json(
          { error: 'This client is already assigned to another trainer' },
          { status: 409 }
        )
      }
    }

    // Get client profile information
    const { data: clientProfile, error: profileError } = await supabaseAdmin
      .from('client_signups')
      .select('first_name, last_name, email, phone')
      .eq('email', clientEmail.toLowerCase())
      .single()

    let firstName = ''
    let lastName = ''
    let phone = ''

    if (clientProfile) {
      firstName = clientProfile.first_name
      lastName = clientProfile.last_name
      phone = clientProfile.phone
    } else {
      // Fallback to profiles table
      const { data: generalProfile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', clientAuthUser.id)
        .single()

      if (generalProfile) {
        firstName = generalProfile.first_name || ''
        lastName = generalProfile.last_name || ''
        phone = generalProfile.phone || ''
      }
    }

    const fullName = `${firstName} ${lastName}`.trim()

    // Create the client record
    const { data: newClient, error: createError } = await supabaseAdmin
      .from('clients')
      .insert([
        {
          trainer_id: trainerId,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName || 'No Name',
          name: fullName || 'No Name',
          email: clientEmail.toLowerCase(),
          phone: phone,
          status: 'active',
          is_active: true
        }
      ])
      .select()
      .single()

    if (createError) {
      console.error('Error creating client:', createError)
      return NextResponse.json(
        { error: 'Failed to add client to your list' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      client: {
        id: newClient.id,
        name: newClient.full_name || newClient.name,
        email: newClient.email,
        status: newClient.status,
        joinDate: newClient.created_at,
        lastActive: 'Just now',
        avatar: newClient.avatar_url
      }
    })

  } catch (error) {
    console.error('Add client API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
