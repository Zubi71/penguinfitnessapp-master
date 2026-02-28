import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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
      class_id,
      session_id,
      trainer_id,
      feedback_type = 'voice',
      rating,
      text_feedback,
      voice_recording_url,
      voice_duration_seconds
    } = body

    // Get client ID from user email
    const { data: clientData, error: clientError } = await supabase
      .from('client_signups')
      .select('id')
      .eq('email', user.email)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Validate required fields
    if (!class_id && !session_id) {
      return NextResponse.json({ error: 'Either class_id or session_id is required' }, { status: 400 })
    }

    if (feedback_type === 'voice' && !voice_recording_url) {
      return NextResponse.json({ error: 'Voice recording URL is required for voice feedback' }, { status: 400 })
    }

    if (feedback_type === 'rating' && (!rating || rating < 1 || rating > 5)) {
      return NextResponse.json({ error: 'Valid rating (1-5) is required for rating feedback' }, { status: 400 })
    }

    // Insert feedback record
    const { data: feedback, error: insertError } = await supabase
      .from('feedback')
      .insert({
        client_id: clientData.id,
        trainer_id,
        class_id,
        session_id,
        feedback_type,
        rating,
        text_feedback,
        voice_recording_url,
        voice_duration_seconds,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting feedback:', insertError)
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
    }

    // If voice feedback, trigger AI processing
    if (feedback_type === 'voice' && voice_recording_url) {
      // This will be handled by a separate background process
      // For now, we'll just return success
      console.log('Voice feedback submitted, AI processing will be triggered')
    }

    return NextResponse.json({
      success: true,
      feedback_id: feedback.id,
      message: 'Feedback submitted successfully'
    })

  } catch (error) {
    console.error('Error in feedback submission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
