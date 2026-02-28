import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withStaff, AuthenticatedRequest } from '@/lib/auth-middleware'

// Get all referral data for admin dashboard
export const GET = withStaff(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get overall statistics
    const { data: stats, error: statsError } = await supabase
      .from('referral_analytics')
      .select(`
        total_referrals,
        successful_referrals,
        total_points_earned,
        conversion_rate
      `)

    if (statsError) {
      console.error('Error fetching referral stats:', statsError)
    }

    // Calculate overall stats
    const overallStats = stats?.reduce((acc, stat) => ({
      totalReferrals: acc.totalReferrals + stat.total_referrals,
      successfulReferrals: acc.successfulReferrals + stat.successful_referrals,
      totalPointsEarned: acc.totalPointsEarned + stat.total_points_earned,
      conversionRate: 0 // Will calculate below
    }), { totalReferrals: 0, successfulReferrals: 0, totalPointsEarned: 0, conversionRate: 0 }) || {
      totalReferrals: 0,
      successfulReferrals: 0,
      totalPointsEarned: 0,
      conversionRate: 0
    }

    if (overallStats.totalReferrals > 0) {
      overallStats.conversionRate = (overallStats.successfulReferrals / overallStats.totalReferrals) * 100
    }

    // Get top performers with user data
    const { data: topPerformers, error: performersError } = await supabase
      .from('referral_analytics')
      .select(`
        user_id,
        total_referrals,
        successful_referrals,
        total_points_earned,
        conversion_rate
      `)
      .order('successful_referrals', { ascending: false })
      .limit(10)

    if (performersError) {
      console.error('Error fetching top performers:', performersError)
    }

    // Get all referral codes with pagination
    const { data: referralCodes, error: codesError } = await supabase
      .from('referral_codes')
      .select(`
        id,
        user_id,
        code,
        max_uses,
        current_uses,
        points_per_referral,
        is_active,
        expires_at,
        created_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (codesError) {
      console.error('Error fetching referral codes:', codesError)
    }

    // Get total count for pagination
    const { count: totalCodes, error: countError } = await supabase
      .from('referral_codes')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error fetching referral codes count:', countError)
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
        referrer_id,
        referred_user_id,
        referral_codes!inner(
          code
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (activityError) {
      console.error('Error fetching recent activity:', activityError)
    }

    // Helper function to get user data
    const getUserData = async (userId: string) => {
      try {
        console.log('Fetching user data for:', userId)
        
        // Try to get from clients table first
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('first_name, last_name, email')
          .eq('user_id', userId)
          .single()
        
        console.log('Client data:', client, 'Error:', clientError)
        
        if (client && !clientError && (client.first_name || client.last_name)) {
          return {
            first_name: client.first_name || 'Unknown',
            last_name: client.last_name || 'User',
            email: client.email || 'No email'
          }
        }

        // Fallback to profiles table if client not found
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', userId)
          .single()
        
        console.log('Profile data:', profile, 'Error:', profileError)
        
        if (profile && !profileError && (profile.first_name || profile.last_name)) {
          return {
            first_name: profile.first_name || 'Unknown',
            last_name: profile.last_name || 'User',
            email: profile.email || 'No email'
          }
        }

        // If profile doesn't exist or has no name, try to get from auth.users
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
        console.log('Auth user data:', authUser, 'Error:', authError)
        
        if (authUser?.user?.email && !authError) {
          // Extract name from email if available
          const emailName = authUser.user.email.split('@')[0]
          return {
            first_name: emailName || 'User',
            last_name: 'Name',
            email: authUser.user.email
          }
        }

        // Final fallback
        return {
          first_name: 'Unknown',
          last_name: 'User',
          email: 'No email'
        }
      } catch (error) {
        console.error('Error fetching user data for user:', userId, error)
        return {
          first_name: 'Unknown',
          last_name: 'User',
          email: 'No email'
        }
      }
    }

    // Get user data for top performers
    const topPerformersWithData = await Promise.all(
      (topPerformers || []).map(async (performer) => {
        const userData = await getUserData(performer.user_id)
        return {
          user_id: performer.user_id,
          total_referrals: performer.total_referrals,
          successful_referrals: performer.successful_referrals,
          total_points_earned: performer.total_points_earned,
          conversion_rate: performer.conversion_rate,
          profiles: userData
        }
      })
    )

    // Get user data for referral codes
    const referralCodesWithData = await Promise.all(
      (referralCodes || []).map(async (code) => {
        const userData = await getUserData(code.user_id)
        return {
          referral_code_id: code.id,
          referrer_id: code.user_id,
          code: code.code,
          max_uses: code.max_uses,
          current_uses: code.current_uses,
          points_per_referral: code.points_per_referral,
          is_active: code.is_active,
          expires_at: code.expires_at,
          created_at: code.created_at,
          total_tracked: 0, // Will be calculated separately if needed
          successful_referrals: 0, // Will be calculated separately if needed
          pending_referrals: 0, // Will be calculated separately if needed
          total_points_awarded: 0, // Will be calculated separately if needed
          profiles: userData
        }
      })
    )

    // Get user data for recent activity
    const recentActivityWithData = await Promise.all(
      (recentActivity || []).map(async (activity) => {
        const referrerData = await getUserData(activity.referrer_id)
        const referredData = await getUserData(activity.referred_user_id)
        return {
          id: activity.id,
          status: activity.status,
          points_awarded: activity.points_awarded,
          completed_at: activity.completed_at,
          created_at: activity.created_at,
          referral_codes: activity.referral_codes,
          referrer: referrerData,
          referred: referredData
        }
      })
    )

    return NextResponse.json({
      overallStats,
      topPerformers: topPerformersWithData,
      referralCodes: referralCodesWithData,
      recentActivity: recentActivityWithData,
      pagination: {
        page,
        limit,
        total: totalCodes || 0,
        totalPages: Math.ceil((totalCodes || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Admin referral dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// Export referral data as CSV
export const POST = withStaff(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { type = 'all', userId } = body

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query
    let filename

    switch (type) {
      case 'codes':
        query = supabase
          .from('referral_codes')
          .select(`
            code,
            user_id,
            max_uses,
            current_uses,
            points_per_referral,
            is_active,
            expires_at,
            created_at,
            profiles!inner(
              first_name,
              last_name,
              email
            )
          `)
        filename = 'referral_codes.csv'
        break

      case 'tracking':
        query = supabase
          .from('referral_tracking')
          .select(`
            id,
            status,
            points_awarded,
            completed_at,
            created_at,
            referral_codes!inner(
              code
            ),
            referrer:profiles!referral_tracking_referrer_id_fkey(
              first_name,
              last_name,
              email
            ),
            referred:profiles!referral_tracking_referred_user_id_fkey(
              first_name,
              last_name,
              email
            )
          `)
        filename = 'referral_tracking.csv'
        break

      case 'analytics':
        query = supabase
          .from('referral_analytics')
          .select(`
            user_id,
            total_referrals,
            successful_referrals,
            total_points_earned,
            conversion_rate,
            last_updated,
            profiles!inner(
              first_name,
              last_name,
              email
            )
          `)
        filename = 'referral_analytics.csv'
        break

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    if (userId) {
      query = query.eq('referrer_id', userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching data for export:', error)
      return NextResponse.json({ error: 'Failed to fetch data for export' }, { status: 500 })
    }

    // Convert to CSV
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No data to export' }, { status: 404 })
    }

    const csv = convertToCSV(data)
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Export referral data API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header]
      if (value === null || value === undefined) return ''
      if (typeof value === 'object') return JSON.stringify(value)
      return `"${String(value).replace(/"/g, '""')}"`
    })
    csvRows.push(values.join(','))
  }

  return csvRows.join('\n')
}
