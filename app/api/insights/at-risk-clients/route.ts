import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/insights/at-risk-clients
 * Gets list of at-risk clients with detailed analysis
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const riskLevel = searchParams.get('risk_level')
    const activeOnly = searchParams.get('active_only') !== 'false'

    let query = supabase
      .from('at_risk_clients')
      .select(`
        *,
        client:client_signups(
          id,
          first_name,
          last_name,
          email,
          phone,
          status
        )
      `)
      .order('risk_level', { ascending: false })
      .order('detected_at', { ascending: false })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    if (riskLevel) {
      query = query.eq('risk_level', riskLevel)
    }

    const { data: atRiskClients, error } = await query

    if (error) {
      console.error('Error fetching at-risk clients:', error)
      return NextResponse.json({ error: 'Failed to fetch at-risk clients' }, { status: 500 })
    }

    // Get summary statistics
    const summary = {
      total: atRiskClients?.length || 0,
      by_level: {
        critical: atRiskClients?.filter((c: any) => c.risk_level === 'critical').length || 0,
        high: atRiskClients?.filter((c: any) => c.risk_level === 'high').length || 0,
        medium: atRiskClients?.filter((c: any) => c.risk_level === 'medium').length || 0,
        low: atRiskClients?.filter((c: any) => c.risk_level === 'low').length || 0
      },
      total_revenue_at_risk: atRiskClients?.reduce((sum: number, c: any) => 
        sum + (parseFloat(c.revenue_at_risk || 0)), 0) || 0
    }

    return NextResponse.json({
      success: true,
      summary,
      clients: atRiskClients || []
    })

  } catch (error) {
    console.error('Error in at-risk clients API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/insights/at-risk-clients/detect
 * Manually trigger at-risk client detection
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

    // Run detection function
    const { data: riskData, error: detectError } = await supabase.rpc('detect_at_risk_clients')

    if (detectError) {
      console.error('Error detecting at-risk clients:', detectError)
      return NextResponse.json({ error: 'Failed to detect at-risk clients' }, { status: 500 })
    }

    // Insert or update at-risk records
    let inserted = 0
    let updated = 0

    for (const risk of riskData || []) {
      // Check if record exists
      const { data: existing } = await supabase
        .from('at_risk_clients')
        .select('id')
        .eq('client_id', risk.client_id)
        .eq('is_active', true)
        .single()

      if (existing) {
        // Update existing record
        await supabase
          .from('at_risk_clients')
          .update({
            risk_level: risk.risk_level,
            risk_factors: risk.risk_factors,
            days_inactive: risk.days_inactive,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
        updated++
      } else {
        // Insert new record
        await supabase.from('at_risk_clients').insert({
          client_id: risk.client_id,
          risk_level: risk.risk_level,
          risk_factors: risk.risk_factors,
          days_inactive: risk.days_inactive
        })
        inserted++

        // Log system event
        await supabase.rpc('log_system_event', {
          p_event_type: 'client_at_risk_detected',
          p_client_id: risk.client_id,
          p_metadata: {
            risk_level: risk.risk_level,
            days_inactive: risk.days_inactive
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      detected: riskData?.length || 0,
      inserted,
      updated
    })

  } catch (error) {
    console.error('Error in at-risk detection:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

