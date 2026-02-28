import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Handle legacy token format from email links
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  if (!token) {
    // Redirect to reset password page with error
    const resetUrl = new URL('/auth/reset-password', request.url)
    resetUrl.searchParams.set('error', 'missing_token')
    return NextResponse.redirect(resetUrl)
  }

  try {
    // Try to exchange the legacy token for proper session tokens
    const supabase = await createClient()
    
    // This is a workaround - we'll redirect to the forgot password page
    // and ask the user to request a new reset
    const resetUrl = new URL('/auth/forgot-password', request.url)
    resetUrl.searchParams.set('message', 'legacy_token')
    return NextResponse.redirect(resetUrl)
    
  } catch (error) {
    console.error('Token exchange error:', error)
    const resetUrl = new URL('/auth/reset-password', request.url)
    resetUrl.searchParams.set('error', 'invalid_token')
    return NextResponse.redirect(resetUrl)
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
