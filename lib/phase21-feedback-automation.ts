/**
 * Phase 21: Automated Feedback Collection
 * Triggers feedback requests at high-impact moments
 */

import { createClient } from '@/utils/supabase/server'

export interface FeedbackTrigger {
  trigger_type: 'first_lesson_complete' | 'trainer_replacement' | 'emergency_sop_resolved' | 
                'package_complete' | 'reengagement_attempt' | 'cancellation' | 'at_risk_detected'
  client_id: string
  class_id?: string
  enrollment_id?: string
  event_id?: string
  language_preference?: string
}

/**
 * Create a feedback trigger
 */
export async function createFeedbackTrigger(trigger: FeedbackTrigger): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    // Calculate expiry (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data, error } = await supabase
      .from('feedback_triggers')
      .insert({
        trigger_type: trigger.trigger_type,
        client_id: trigger.client_id,
        class_id: trigger.class_id || null,
        enrollment_id: trigger.enrollment_id || null,
        event_id: trigger.event_id || null,
        status: 'pending',
        language_preference: trigger.language_preference || 'en',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating feedback trigger:', error)
      return null
    }

    // In a real implementation, this would trigger an email/WhatsApp notification
    // For now, we'll just log it
    console.log('Feedback trigger created:', data.id)

    return data.id
  } catch (error) {
    console.error('Error in createFeedbackTrigger:', error)
    return null
  }
}

/**
 * Trigger feedback after first lesson completion
 */
export async function triggerFirstLessonFeedback(
  clientId: string,
  classId: string,
  enrollmentId?: string
) {
  return createFeedbackTrigger({
    trigger_type: 'first_lesson_complete',
    client_id: clientId,
    class_id: classId,
    enrollment_id: enrollmentId
  })
}

/**
 * Trigger feedback after trainer replacement
 */
export async function triggerTrainerReplacementFeedback(
  clientId: string,
  classId: string,
  eventId?: string
) {
  return createFeedbackTrigger({
    trigger_type: 'trainer_replacement',
    client_id: clientId,
    class_id: classId,
    event_id: eventId
  })
}

/**
 * Trigger feedback after Emergency SOP resolution
 */
export async function triggerEmergencySOPFeedback(
  clientId: string,
  classId: string,
  eventId?: string
) {
  return createFeedbackTrigger({
    trigger_type: 'emergency_sop_resolved',
    client_id: clientId,
    class_id: classId,
    event_id: eventId
  })
}

/**
 * Trigger feedback when package is completed
 */
export async function triggerPackageCompleteFeedback(
  clientId: string,
  enrollmentId: string
) {
  return createFeedbackTrigger({
    trigger_type: 'package_complete',
    client_id: clientId,
    enrollment_id: enrollmentId
  })
}

/**
 * Trigger feedback for at-risk clients
 */
export async function triggerAtRiskFeedback(
  clientId: string,
  eventId?: string
) {
  return createFeedbackTrigger({
    trigger_type: 'at_risk_detected',
    client_id: clientId,
    event_id: eventId
  })
}

/**
 * Get pending feedback triggers for a client
 */
export async function getPendingFeedbackTriggers(clientId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('feedback_triggers')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching feedback triggers:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getPendingFeedbackTriggers:', error)
    return []
  }
}

/**
 * Mark feedback trigger as completed
 */
export async function completeFeedbackTrigger(
  triggerId: string,
  feedbackId: string
) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('feedback_triggers')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        feedback_id: feedbackId
      })
      .eq('id', triggerId)
      .select()
      .single()

    if (error) {
      console.error('Error completing feedback trigger:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in completeFeedbackTrigger:', error)
    return null
  }
}

