/**
 * Phase 21: Event Tracking Utility
 * Centralized event logging for impact measurement
 */

export interface EventTrackingData {
  event_type: string
  client_id?: string
  trainer_id?: string
  class_id?: string
  enrollment_id?: string
  payment_id?: string
  location?: string
  channel?: 'admin' | 'whatsapp' | 'ai_bot' | 'web' | 'mobile' | 'system'
  outcome_status?: 'success' | 'failure' | 'pending' | 'partial'
  metadata?: Record<string, any>
}

/**
 * Track a system event
 */
export async function trackEvent(data: EventTrackingData): Promise<string | null> {
  try {
    const response = await fetch('/api/events/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include'
    })

    if (!response.ok) {
      console.error('Failed to track event:', await response.text())
      return null
    }

    const result = await response.json()
    return result.event_id || null
  } catch (error) {
    console.error('Error tracking event:', error)
    return null
  }
}

/**
 * Track class booking events
 */
export async function trackClassBooking(
  action: 'created' | 'cancelled' | 'rescheduled',
  classId: string,
  clientId?: string,
  trainerId?: string,
  location?: string,
  channel: EventTrackingData['channel'] = 'web',
  metadata?: Record<string, any>
) {
  const eventType = `class_booking_${action}` as const
  
  return trackEvent({
    event_type: eventType,
    class_id: classId,
    client_id: clientId,
    trainer_id: trainerId,
    location,
    channel,
    outcome_status: 'success',
    metadata: {
      action,
      ...metadata
    }
  })
}

/**
 * Track trainer assignment events
 */
export async function trackTrainerAssignment(
  action: 'assigned' | 'replaced' | 'reassigned',
  trainerId: string,
  classId?: string,
  clientId?: string,
  previousTrainerId?: string,
  metadata?: Record<string, any>
) {
  const eventType = `trainer_${action}` as const
  
  return trackEvent({
    event_type: eventType,
    trainer_id: trainerId,
    class_id: classId,
    client_id: clientId,
    channel: 'admin',
    outcome_status: 'success',
    metadata: {
      action,
      previous_trainer_id: previousTrainerId,
      ...metadata
    }
  })
}

/**
 * Track payment events
 */
export async function trackPayment(
  success: boolean,
  paymentId: string,
  clientId?: string,
  amount?: number,
  metadata?: Record<string, any>
) {
  return trackEvent({
    event_type: success ? 'payment_success' : 'payment_failure',
    payment_id: paymentId,
    client_id: clientId,
    channel: 'web',
    outcome_status: success ? 'success' : 'failure',
    metadata: {
      amount,
      ...metadata
    }
  })
}

/**
 * Track client inactivity
 */
export async function trackClientInactivity(
  days: 30 | 60 | 90,
  clientId: string,
  lastActivityDate?: string,
  metadata?: Record<string, any>
) {
  return trackEvent({
    event_type: `client_inactivity_${days}` as const,
    client_id: clientId,
    channel: 'system',
    outcome_status: 'pending',
    metadata: {
      days_inactive: days,
      last_activity_date: lastActivityDate,
      ...metadata
    }
  })
}

/**
 * Track cancellation with reason
 */
export async function trackCancellationWithReason(
  eventId: string,
  classId: string,
  clientId: string,
  reasonCategory?: string,
  reasonText?: string,
  hoursBeforeClass?: number,
  isRebooked?: boolean,
  rebookedToClassId?: string
) {
  try {
    const response = await fetch('/api/events/cancellation-reason', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_id: eventId,
        class_id: classId,
        client_id: clientId,
        reason_category: reasonCategory,
        reason_text: reasonText,
        hours_before_class: hoursBeforeClass,
        is_rebooked: isRebooked,
        rebooked_to_class_id: rebookedToClassId
      }),
      credentials: 'include'
    })

    if (!response.ok) {
      console.error('Failed to track cancellation reason:', await response.text())
      return null
    }

    const result = await response.json()
    return result.cancellation_reason_id || null
  } catch (error) {
    console.error('Error tracking cancellation reason:', error)
    return null
  }
}

/**
 * Track referral events
 */
export async function trackReferral(
  action: 'code_used' | 'converted',
  clientId: string,
  referralCode?: string,
  metadata?: Record<string, any>
) {
  return trackEvent({
    event_type: action === 'code_used' ? 'referral_code_used' : 'referral_converted',
    client_id: clientId,
    channel: 'web',
    outcome_status: 'success',
    metadata: {
      referral_code: referralCode,
      ...metadata
    }
  })
}

/**
 * Track feedback submission
 */
export async function trackFeedback(
  type: 'client' | 'trainer',
  clientId?: string,
  trainerId?: string,
  classId?: string,
  metadata?: Record<string, any>
) {
  return trackEvent({
    event_type: type === 'client' ? 'client_feedback_submitted' : 'trainer_feedback_submitted',
    client_id: clientId,
    trainer_id: trainerId,
    class_id: classId,
    channel: 'web',
    outcome_status: 'success',
    metadata
  })
}

