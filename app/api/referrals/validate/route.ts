import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Validate referral code (public endpoint)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate referral code using database function
    const { data, error } = await supabase.rpc('validate_referral_code', {
      p_code: code
    })

    if (error) {
      console.error('Error validating referral code:', error)
      return NextResponse.json({ error: 'Failed to validate referral code' }, { status: 500 })
    }

    const result = data[0]
    
    if (!result.is_valid) {
      return NextResponse.json({ 
        valid: false, 
        message: 'Invalid or expired referral code' 
      })
    }

    return NextResponse.json({ 
      valid: true, 
      referralCode: {
        id: result.referral_code_id,
        code: code,
        referrerId: result.referrer_id,
        pointsPerReferral: result.points_per_referral,
        maxUses: result.max_uses,
        currentUses: result.current_uses,
        isActive: result.is_active,
        expiresAt: result.expires_at
      }
    })
  } catch (error) {
    console.error('Validate referral code API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}