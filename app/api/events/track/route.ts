import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/events/track
 * Logs a system event for impact measurement
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      event_type,
      client_id,
      trainer_id,
      class_id,
      enrollment_id,
      payment_id,
      location,
      channel = 'web',
      outcome_status = 'success',
      metadata
    } = body

    // Validate required fields
    if (!event_type) {
      return NextResponse.json({ error: 'event_type is required' }, { status: 400 })
    }

    // Validate event type
    const validEventTypes = [
      'class_booking_created',
      'class_booking_cancelled',
      'class_booking_rescheduled',
      'trainer_assigned',
      'trainer_replaced',
      'trainer_reassigned',
      'client_inactivity_30',
      'client_inactivity_60',
      'client_inactivity_90',
      'payment_success',
      'payment_failure',
      'package_expired',
      'package_topup',
      'emergency_sop_activated',
      'referral_code_used',
      'referral_converted',
      'marketing_message_sent',
      'client_feedback_submitted',
      'trainer_feedback_submitted',
      'client_at_risk_detected',
      'cancellation_reason_recorded',
      'revenue_leakage_detected'
    ]

    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 })
    }

    // Log the event using the database function
    const { data: eventData, error: eventError } = await supabase.rpc('log_system_event', {
      p_event_type: event_type,
      p_client_id: client_id || null,
      p_trainer_id: trainer_id || null,
      p_class_id: class_id || null,
      p_enrollment_id: enrollment_id || null,
      p_payment_id: payment_id || null,
      p_location: location || null,
      p_channel: channel,
      p_outcome_status: outcome_status,
      p_metadata: metadata || null
    })

    if (eventError) {
      console.error('Error logging system event:', eventError)
      return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
    }

    // Trigger automated actions based on event type
    if (event_type === 'class_booking_cancelled') {
      // Trigger cancellation reason collection
      await triggerCancellationReasonCollection(eventData, supabase)
    }

    if (event_type === 'client_inactivity_30' || event_type === 'client_inactivity_60' || event_type === 'client_inactivity_90') {
      // Trigger at-risk client detection
      await triggerAtRiskDetection(client_id, supabase)
    }

    return NextResponse.json({
      success: true,
      event_id: eventData
    })

  } catch (error) {
    console.error('Error in event tracking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function triggerCancellationReasonCollection(eventId: string, supabase: any) {
  // This would typically trigger a feedback request or admin notification
  // For now, we'll just log it
  console.log('Cancellation reason collection triggered for event:', eventId)
}

async function triggerAtRiskDetection(clientId: string, supabase: any) {
  try {
    // Check if client is already marked as at-risk
    const { data: existing } = await supabase
      .from('at_risk_clients')
      .select('id')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .single()

    if (!existing) {
      // Run detection function
      const { data: riskData, error } = await supabase.rpc('detect_at_risk_clients')
      
      if (!error && riskData) {
        const clientRisk = riskData.find((r: any) => r.client_id === clientId)
        if (clientRisk) {
          // Insert at-risk record
          await supabase.from('at_risk_clients').insert({
            client_id: clientId,
            risk_level: clientRisk.risk_level,
            risk_factors: clientRisk.risk_factors,
            days_inactive: clientRisk.days_inactive
          })
        }
      }
    }
  } catch (error) {
    console.error('Error in at-risk detection:', error)
  }
}

