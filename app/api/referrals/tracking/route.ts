import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

// Get referral tracking data
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'sent' // 'sent' or 'received'

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabase
      .from('referral_tracking')
      .select(`
        id,
        status,
        points_awarded,
        completed_at,
        created_at,
        referral_code_id,
        referral_codes!inner(
          code,
          points_per_referral
        )
      `)

    if (type === 'sent') {
      query = query.eq('referrer_id', req.user.id)
    } else if (type === 'received') {
      query = query.eq('referred_user_id', req.user.id)
    }

    const { data: tracking, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching referral tracking:', error)
      return NextResponse.json({ error: 'Failed to fetch referral tracking' }, { status: 500 })
    }

    return NextResponse.json({ tracking })
  } catch (error) {
    console.error('Referral tracking API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// Track a referral
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { referralCode, referredUserId } = body

    if (!referralCode || !referredUserId) {
      return NextResponse.json({ error: 'Referral code and referred user ID are required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Track referral using database function
    const { data, error } = await supabase.rpc('track_referral', {
      p_referral_code: referralCode,
      p_referred_user_id: referredUserId
    })

    if (error) {
      console.error('Error tracking referral:', error)
      return NextResponse.json({ error: 'Failed to track referral' }, { status: 500 })
    }

    const result = data[0]
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      trackingId: result.referral_tracking_id,
      message: result.message 
    })
  } catch (error) {
    console.error('Track referral API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// Complete a referral (award points)
export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { trackingId } = body

    if (!trackingId) {
      return NextResponse.json({ error: 'Tracking ID is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Complete referral using database function
    const { data, error } = await supabase.rpc('complete_referral', {
      p_referral_tracking_id: trackingId
    })

    if (error) {
      console.error('Error completing referral:', error)
      return NextResponse.json({ error: 'Failed to complete referral' }, { status: 500 })
    }

    const result = data[0]
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      pointsAwarded: result.points_awarded,
      message: result.message 
    })
  } catch (error) {
    console.error('Complete referral API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})