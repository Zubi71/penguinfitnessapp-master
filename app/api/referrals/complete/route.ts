import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

// Complete referral when payment is successful
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { referralCode, paymentAmount, paymentId } = body

    if (!referralCode) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find the referral tracking record
    const { data: trackingRecord, error: trackingError } = await supabase
      .from('referral_tracking')
      .select(`
        id,
        status,
        referrer_id,
        referral_codes!inner(
          code,
          points_per_referral
        )
      `)
      .eq('referred_user_id', req.user.id)
      .eq('referral_codes.code', referralCode)
      .eq('status', 'pending')
      .single()

    if (trackingError || !trackingRecord) {
      return NextResponse.json({ 
        error: 'Referral tracking record not found or already completed' 
      }, { status: 404 })
    }

    // Complete the referral using the database function
    const { data: completionResult, error: completionError } = await supabase.rpc('complete_referral', {
      p_referral_tracking_id: trackingRecord.id
    })

    if (completionError) {
      console.error('Error completing referral:', completionError)
      return NextResponse.json({ error: 'Failed to complete referral' }, { status: 500 })
    }

    const result = completionResult[0]
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    // Log the referral completion for audit purposes
    console.log(`Referral completed: ${referralCode} for user ${req.user.id}, ${result.points_awarded} points awarded`)

    return NextResponse.json({
      success: true,
      pointsAwarded: result.points_awarded,
      message: `Referral completed! ${result.points_awarded} points awarded to referrer.`
    })

  } catch (error) {
    console.error('Complete referral API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// Get referral status for a user
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const referralCode = searchParams.get('code')

    if (!referralCode) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user has a pending referral with this code
    const { data: trackingRecord, error: trackingError } = await supabase
      .from('referral_tracking')
      .select(`
        id,
        status,
        points_awarded,
        completed_at,
        created_at,
        referral_codes!inner(
          code,
          points_per_referral
        )
      `)
      .eq('referred_user_id', req.user.id)
      .eq('referral_codes.code', referralCode)
      .single()

    if (trackingError) {
      return NextResponse.json({ 
        error: 'No referral found for this code and user' 
      }, { status: 404 })
    }

    return NextResponse.json({
      trackingRecord,
      isCompleted: trackingRecord.status === 'completed',
      pointsAwarded: trackingRecord.points_awarded
    })

  } catch (error) {
    console.error('Get referral status API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
