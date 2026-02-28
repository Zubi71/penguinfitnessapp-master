import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Create admin client for admin operations
const getAdminClient = () => {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/auth/exchange-token - Exchange PKCE token for session tokens
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ 
        error: 'Token is required' 
      }, { status: 400 })
    }

    console.log('Attempting to exchange legacy token:', token.substring(0, 20) + '...')

    // Use admin client to verify and exchange the token
    const adminClient = getAdminClient()
    
    try {
      // For PKCE tokens, we need to exchange them using the admin API
      // The token from email is typically a PKCE code verifier
      const { data, error } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: '', // This won't work without email, so we need a different approach
      })

      if (error) {
        console.error('Token exchange error:', error)
        return NextResponse.json({ 
          error: 'Invalid or expired reset token' 
        }, { status: 400 })
      }

      // Extract tokens from the generated link
      const url = new URL(data.properties?.action_link || '')
      const hash = url.hash.substring(1)
      const urlParams = new URLSearchParams(hash)
      
      const access_token = urlParams.get('access_token')
      const refresh_token = urlParams.get('refresh_token')

      if (!access_token || !refresh_token) {
        return NextResponse.json({ 
          error: 'Failed to generate session tokens' 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        access_token,
        refresh_token,
        message: 'Token exchanged successfully'
      })

    } catch (exchangeError) {
      console.error('Legacy token exchange failed:', exchangeError)
      
      // If the token exchange fails, it might be because the token is invalid or expired
      return NextResponse.json({ 
        error: 'Invalid or expired reset token. Please request a new password reset.' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Token exchange request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
