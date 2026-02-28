import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth-middleware'

export const GET = withAuth(async (req) => {
  try {
    console.log('🔍 Getting available clients for user:', req.user.id, 'Role:', req.user.role)

    // Only trainers and admins can get available clients
    if (req.user.role !== 'trainer' && req.user.role !== 'admin') {
      console.log('❌ Unauthorized role:', req.user.role)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

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

    // Simplified approach: Get all users with client role first
    console.log('🏷️ Fetching all users with client role...')
    const { data: clientRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'client')

    if (roleError) {
      console.error('❌ Error fetching client roles:', roleError)
      return NextResponse.json(
        { error: 'Failed to fetch client users: ' + roleError.message },
        { status: 500 }
      )
    }

    console.log('🏷️ Users with client role:', clientRoles?.length || 0)

    if (!clientRoles || clientRoles.length === 0) {
      console.log('⚠️ No users with client role found')
      return NextResponse.json({ users: [] })
    }

    const clientUserIds = clientRoles.map(role => role.user_id)
    console.log('Client user IDs:', clientUserIds)

    // Get auth users
    console.log('👥 Fetching auth users...')
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return NextResponse.json(
        { error: 'Failed to fetch user data: ' + authError.message },
        { status: 500 }
      )
    }

    console.log('� Total auth users found:', authUsers.users.length)

    // Filter to only client users
    const clientAuthUsers = authUsers.users.filter(user => 
      clientUserIds.includes(user.id)
    )

    console.log('🔍 Client auth users found:', clientAuthUsers.length)

    if (clientAuthUsers.length === 0) {
      console.log('⚠️ No client auth users found')
      return NextResponse.json({ users: [] })
    }

    // Get profiles - try both tables
    const userEmails = clientAuthUsers.map(user => user.email).filter(Boolean)
    console.log('📧 Looking up profiles for emails:', userEmails)

    const { data: clientProfiles } = await supabaseAdmin
      .from('client_signups')
      .select('first_name, last_name, email, phone')
      .in('email', userEmails)

    console.log('👤 Client profiles found:', clientProfiles?.length || 0)

    const { data: generalProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, first_name, last_name, phone')
      .in('id', clientUserIds)

    console.log('👤 General profiles found:', generalProfiles?.length || 0)

    // Build user list
    const availableUsers = clientAuthUsers.map(authUser => {
      const clientProfile = clientProfiles?.find(p => p.email === authUser.email)
      const generalProfile = generalProfiles?.find(p => p.id === authUser.id)
      
      let firstName = 'Unknown'
      let lastName = 'User'
      let phone = ''

      if (clientProfile) {
        firstName = clientProfile.first_name || firstName
        lastName = clientProfile.last_name || lastName
        phone = clientProfile.phone || phone
      } else if (generalProfile) {
        firstName = generalProfile.first_name || firstName
        lastName = generalProfile.last_name || lastName
        phone = generalProfile.phone || phone
      } else if (authUser.user_metadata) {
        firstName = authUser.user_metadata.first_name || authUser.email?.split('@')[0] || firstName
        lastName = authUser.user_metadata.last_name || lastName
        phone = authUser.user_metadata.phone || phone
      }

      return {
        id: authUser.id,
        email: authUser.email,
        first_name: firstName,
        last_name: lastName,
        phone: phone
      }
    })

    // For now, return all users (we'll add trainer filtering later)
    const finalUsers = availableUsers
      .filter(user => user.first_name !== 'Unknown' || user.last_name !== 'User')
      .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`))

    console.log('✅ Final available users:', finalUsers.length)
    console.log('User details:', finalUsers.map(u => ({ name: `${u.first_name} ${u.last_name}`, email: u.email })))

    return NextResponse.json({ users: finalUsers })

  } catch (error) {
    console.error('❌ Get available clients API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})

// Remove the helper function since we're not using it anymore
