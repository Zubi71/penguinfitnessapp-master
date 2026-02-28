import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // Not needed for reading, but required by the interface
          },
        },
      }
    )
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user points
    const { data: points, error: pointsError } = await supabase
      .from('client_points')
      .select('*')
      .eq('client_id', user.id)
      .single()

    if (pointsError && pointsError.code !== 'PGRST116') {
      console.error('Error fetching points:', pointsError)
      return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 })
    }

    // Get recent point transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
    }

    // Get active rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from('client_rewards')
      .select('*')
      .eq('client_id', user.id)
      .eq('is_active', true)
      .is('used_at', null)
      .order('created_at', { ascending: false })

    if (rewardsError) {
      console.error('Error fetching rewards:', rewardsError)
    }

    return NextResponse.json({
      points: points || { points_balance: 0, total_points_earned: 0, total_points_spent: 0 },
      transactions: transactions || [],
      rewards: rewards || []
    })

  } catch (error) {
    console.error('Error in points API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
