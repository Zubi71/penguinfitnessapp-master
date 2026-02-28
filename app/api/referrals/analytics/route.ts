import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

// Get referral analytics
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId') || req.user.id

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get analytics using database function
    const { data, error } = await supabase.rpc('get_referral_analytics', {
      p_user_id: userId
    })

    if (error) {
      console.error('Error fetching referral analytics:', error)
      return NextResponse.json({ error: 'Failed to fetch referral analytics' }, { status: 500 })
    }

    const analytics = data[0]

    // Get detailed referral codes data
    const { data: referralCodes, error: codesError } = await supabase
      .from('referral_summary')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })

    if (codesError) {
      console.error('Error fetching referral codes:', codesError)
    }

    // Get recent referral activity
    const { data: recentActivity, error: activityError } = await supabase
      .from('referral_tracking')
      .select(`
        id,
        status,
        points_awarded,
        completed_at,
        created_at,
        referral_codes!inner(
          code
        )
      `)
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (activityError) {
      console.error('Error fetching recent activity:', activityError)
    }

    return NextResponse.json({ 
      analytics,
      referralCodes: referralCodes || [],
      recentActivity: recentActivity || []
    })
  } catch (error) {
    console.error('Referral analytics API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})