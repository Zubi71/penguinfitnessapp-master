import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Create admin client for admin operations
const getAdminClient = () => {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/auth/reset-password - Request password reset
export async function POST(request: NextRequest) {
  try {
    const { email: inputEmail, isAdminReset, userId } = await request.json()
    let email = inputEmail

    console.log('Password reset request:', { email: inputEmail, isAdminReset, userId })

    if (!email && !userId) {
      return NextResponse.json({ 
        error: 'Email or user ID is required' 
      }, { status: 400 })
    }

    // If this is an admin-initiated reset, verify admin privileges
    if (isAdminReset) {
      const supabase = await createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      console.log('Admin reset - Auth check:', { user: user?.id, error: authError })
      
      if (!user) {
        console.log('Admin reset - No user found in session')
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }

      // Check if user is admin
      const adminClient = getAdminClient()
      const { data: userRole, error: roleError } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      console.log('Admin reset - Role check:', { userRole, roleError })

      if (!userRole || userRole.role !== 'admin') {
        console.log('Admin reset - User is not admin:', { userRole })
        return NextResponse.json({ 
          error: 'Admin privileges required for admin-initiated password reset' 
        }, { status: 403 })
      }

      // For admin reset, get user email if userId provided
      if (userId && !email) {
        const { data: targetUser } = await adminClient.auth.admin.getUserById(userId)
        if (!targetUser.user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        email = targetUser.user.email
      }
    }

    // For regular user reset, use the standard method that sends email
    // For admin reset, use admin method that generates link
    if (isAdminReset) {
      // Use admin client for admin-initiated reset (generates link, may not send email)
      const resetAdminClient = getAdminClient()
      
      const { data, error } = await resetAdminClient.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
        }
      })

      if (error) {
        console.error('Admin password reset error:', error)
        return NextResponse.json({ 
          error: 'Failed to generate password reset link' 
        }, { status: 500 })
      }

      console.log(`Admin password reset link generated for: ${email}`)
      
      return NextResponse.json({ 
        message: 'Password reset link generated successfully',
        resetLink: data.properties?.action_link // For admin use
      })
    } else {
      // Use regular client for user-initiated reset (sends email automatically)
      const supabase = await createClient()
      
      console.log(`Attempting to send password reset email to: ${email}`)
      console.log(`Redirect URL: ${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`)
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`
      })

      if (error) {
        console.error('User password reset error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return NextResponse.json({ 
          error: `Failed to send password reset email: ${error.message}` 
        }, { status: 500 })
      }

      console.log(`Password reset email sent successfully to: ${email}`)
      console.log('Reset response data:', data)
      
      return NextResponse.json({ 
        message: 'Password reset email sent successfully'
      })
    }

  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/auth/reset-password - Update password with reset token
export async function PUT(request: NextRequest) {
  try {
    const { password, accessToken, refreshToken, tokenType } = await request.json()

    if (!password) {
      return NextResponse.json({ 
        error: 'New password is required' 
      }, { status: 400 })
    }

    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Reset token is required' 
      }, { status: 400 })
    }

    console.log('Password reset attempt with token type:', tokenType || 'unknown')

    // Handle code token format (when tokenType is 'code')
    if (tokenType === 'code') {
      console.log('Handling code token format')
      
      try {
        // For code tokens, we use verifyOtp with type 'recovery'
        const adminClient = getAdminClient()
        
        console.log('Attempting to verify code token:', accessToken.substring(0, 20) + '...')
        
        const { data: sessionData, error: sessionError } = await adminClient.auth.verifyOtp({
          token_hash: accessToken,
          type: 'recovery'
        })

        if (sessionError || !sessionData.user) {
          console.error('Code token verification failed:', sessionError)
          return NextResponse.json({ 
            error: 'Invalid or expired reset link. Please request a new password reset.' 
          }, { status: 400 })
        }

        console.log('Code token verified for user:', sessionData.user.id)

        // Update the password using admin client
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
          sessionData.user.id,
          { password: password }
        )

        if (updateError) {
          console.error('Password update error with code token:', updateError)
          return NextResponse.json({ 
            error: 'Failed to update password. Please try again.' 
          }, { status: 500 })
        }

        console.log('Password updated successfully with code token')
        
        return NextResponse.json({ 
          message: 'Password updated successfully' 
        })
        
      } catch (codeError) {
        console.error('Code token handling error:', codeError)
        return NextResponse.json({ 
          error: 'Invalid reset link. Please request a new password reset.' 
        }, { status: 400 })
      }
    }

    // Handle PKCE token format (when tokenType is 'pkce_legacy')
    if (tokenType === 'pkce_legacy') {
      console.log('Handling PKCE token format')
      
      try {
        // For PKCE tokens, we need to verify the token using Supabase auth
        const adminClient = getAdminClient()
        
        // Try to verify the PKCE token by attempting to use it with Supabase
        const { data: sessionData, error: sessionError } = await adminClient.auth.verifyOtp({
          token_hash: accessToken,
          type: 'recovery'
        })

        if (sessionError || !sessionData.user) {
          console.error('PKCE token verification failed:', sessionError)
          return NextResponse.json({ 
            error: 'Invalid or expired reset link. Please request a new password reset.' 
          }, { status: 400 })
        }

        console.log('PKCE token verified for user:', sessionData.user.id)

        // Now update the password using admin client
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
          sessionData.user.id,
          { password: password }
        )

        if (updateError) {
          console.error('Password update error with PKCE token:', updateError)
          return NextResponse.json({ 
            error: 'Failed to update password. Please try again.' 
          }, { status: 500 })
        }

        console.log('Password updated successfully with PKCE token')
        
        return NextResponse.json({ 
          message: 'Password updated successfully' 
        })
        
      } catch (pkceError) {
        console.error('PKCE token handling error:', pkceError)
        return NextResponse.json({ 
          error: 'Invalid reset link. Please request a new password reset.' 
        }, { status: 400 })
      }
    }

    // Handle modern token format (access_token and refresh_token)
    if (tokenType === 'modern') {
      if (!refreshToken || refreshToken === 'legacy') {
        return NextResponse.json({ 
          error: 'Invalid token format. Please request a new password reset.' 
        }, { status: 400 })
      }

      const supabase = await createClient()
      
      // Set the session with the reset tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })

      if (sessionError) {
        console.error('Session error:', sessionError)
        return NextResponse.json({ 
          error: 'Invalid or expired reset tokens' 
        }, { status: 400 })
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        console.error('Password update error:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update password' 
        }, { status: 500 })
      }

      console.log('Password updated successfully')
      
      return NextResponse.json({ 
        message: 'Password updated successfully' 
      })
    }

    // Fallback for unknown token types
    console.error('Unknown token type:', tokenType)
    return NextResponse.json({ 
      error: 'Invalid token format. Please request a new password reset.' 
    }, { status: 400 })

  } catch (error) {
    console.error('Password update request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
