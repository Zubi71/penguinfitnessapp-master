import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/insights/revenue-leakage
 * Gets revenue leakage analysis
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)
    const includeRecovered = searchParams.get('include_recovered') === 'true'

    let query = supabase
      .from('revenue_leakage')
      .select(`
        *,
        client:client_signups(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .gte('detected_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('detected_at', { ascending: false })

    if (!includeRecovered) {
      query = query.eq('recovered', false)
    }

    const { data: leakage, error } = await query

    if (error) {
      console.error('Error fetching revenue leakage:', error)
      return NextResponse.json({ error: 'Failed to fetch revenue leakage' }, { status: 500 })
    }

    // Calculate summary statistics
    const totalLost = leakage?.reduce((sum: number, l: any) => sum + parseFloat(l.amount_lost || 0), 0) || 0
    const totalRecovered = leakage?.filter((l: any) => l.recovered).reduce((sum: number, l: any) => 
      sum + parseFloat(l.recovery_amount || 0), 0) || 0
    const netLoss = totalLost - totalRecovered

    // Group by leakage type
    const byType: Record<string, { count: number; total: number }> = {}
    leakage?.forEach((l: any) => {
      const type = l.leakage_type
      if (!byType[type]) {
        byType[type] = { count: 0, total: 0 }
      }
      byType[type].count++
      byType[type].total += parseFloat(l.amount_lost || 0)
    })

    return NextResponse.json({
      success: true,
      period_days: days,
      summary: {
        total_lost: totalLost,
        total_recovered: totalRecovered,
        net_loss: netLoss,
        recovery_rate: totalLost > 0 ? (totalRecovered / totalLost) * 100 : 0
      },
      by_type: byType,
      records: leakage || []
    })

  } catch (error) {
    console.error('Error in revenue leakage API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/insights/revenue-leakage/detect
 * Manually trigger revenue leakage detection
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    let detected = 0

    // Detect expired packages with unused sessions
    const { data: enrollments } = await supabase
      .from('class_enrollments')
      .select(`
        *,
        client:client_signups(id, first_name, last_name, email),
        class:classes(id, price)
      `)
      .eq('status', 'active')
      .not('class_id', 'is', null)

    // Check for expired packages (simplified - would need package expiry tracking)
    // This is a placeholder - actual implementation would check package expiry dates
    
    // Detect unused sessions from cancelled classes
    const { data: cancelledClasses } = await supabase
      .from('classes')
      .select(`
        *,
        enrollments:class_enrollments(
          id,
          client_id,
          client:client_signups(id, first_name, last_name, email)
        )
      `)
      .eq('status', 'cancelled')
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    for (const cls of cancelledClasses || []) {
      for (const enrollment of cls.enrollments || []) {
        const amountLost = parseFloat(cls.price || 0)
        
        // Check if already recorded
        const { data: existing } = await supabase
          .from('revenue_leakage')
          .select('id')
          .eq('class_id', cls.id)
          .eq('enrollment_id', enrollment.id)
          .eq('recovered', false)
          .single()

        if (!existing && amountLost > 0) {
          await supabase.from('revenue_leakage').insert({
            client_id: enrollment.client_id,
            class_id: cls.id,
            enrollment_id: enrollment.id,
            leakage_type: 'cancellation_no_show',
            amount_lost: amountLost,
            description: `Cancelled class: ${cls.name || 'Unnamed class'}`
          })
          detected++

          // Log system event
          await supabase.rpc('log_system_event', {
            p_event_type: 'revenue_leakage_detected',
            p_client_id: enrollment.client_id,
            p_class_id: cls.id,
            p_metadata: {
              leakage_type: 'cancellation_no_show',
              amount: amountLost
            }
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      detected
    })

  } catch (error) {
    console.error('Error in revenue leakage detection:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

