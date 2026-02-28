import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    
    console.log('Code exchange request:', { code: code?.substring(0, 20) + '...' })

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Code exchange error:', error)
      return NextResponse.json({ 
        error: 'Invalid or expired code. Please request a new password reset.' 
      }, { status: 400 })
    }

    if (!data.session) {
      return NextResponse.json({ 
        error: 'No session created from code exchange.' 
      }, { status: 400 })
    }

    console.log('Code exchange successful for user:', data.user?.id)

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user
    })

  } catch (error) {
    console.error('Code exchange error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
