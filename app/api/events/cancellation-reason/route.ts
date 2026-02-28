import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/events/cancellation-reason
 * Records cancellation reason for analysis
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      event_id,
      class_id,
      enrollment_id,
      client_id,
      reason_category,
      reason_text,
      hours_before_class,
      is_rebooked = false,
      rebooked_to_class_id
    } = body

    if (!reason_category && !reason_text) {
      return NextResponse.json({ error: 'Either reason_category or reason_text is required' }, { status: 400 })
    }

    // Insert cancellation reason
    const { data: cancellationReason, error: insertError } = await supabase
      .from('cancellation_reasons')
      .insert({
        event_id: event_id || null,
        class_id: class_id || null,
        enrollment_id: enrollment_id || null,
        client_id: client_id || null,
        reason_category: reason_category || null,
        reason_text: reason_text || null,
        hours_before_class: hours_before_class || null,
        is_rebooked: is_rebooked,
        rebooked_to_class_id: rebooked_to_class_id || null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting cancellation reason:', insertError)
      return NextResponse.json({ error: 'Failed to record cancellation reason' }, { status: 500 })
    }

    // Log system event
    await supabase.rpc('log_system_event', {
      p_event_type: 'cancellation_reason_recorded',
      p_client_id: client_id || null,
      p_class_id: class_id || null,
      p_enrollment_id: enrollment_id || null,
      p_metadata: {
        reason_category,
        hours_before_class,
        is_rebooked
      }
    })

    return NextResponse.json({
      success: true,
      cancellation_reason_id: cancellationReason.id
    })

  } catch (error) {
    console.error('Error recording cancellation reason:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/events/cancellation-reason
 * Gets cancellation reason analytics
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

    // Get cancellation reasons grouped by category
    const { data: reasons, error } = await supabase
      .from('cancellation_reasons')
      .select('*')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    if (error) {
      console.error('Error fetching cancellation reasons:', error)
      return NextResponse.json({ error: 'Failed to fetch cancellation reasons' }, { status: 500 })
    }

    // Aggregate by category
    const categoryCounts: Record<string, number> = {}
    const averageHoursBefore: Record<string, number[]> = {}

    reasons?.forEach((reason: any) => {
      const category = reason.reason_category || 'other'
      categoryCounts[category] = (categoryCounts[category] || 0) + 1
      
      if (reason.hours_before_class) {
        if (!averageHoursBefore[category]) {
          averageHoursBefore[category] = []
        }
        averageHoursBefore[category].push(reason.hours_before_class)
      }
    })

    const analytics = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: (count / (reasons?.length || 1)) * 100,
      average_hours_before: averageHoursBefore[category]
        ? averageHoursBefore[category].reduce((a, b) => a + b, 0) / averageHoursBefore[category].length
        : null
    }))

    return NextResponse.json({
      success: true,
      total_cancellations: reasons?.length || 0,
      period_days: days,
      by_category: analytics
    })

  } catch (error) {
    console.error('Error fetching cancellation analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

