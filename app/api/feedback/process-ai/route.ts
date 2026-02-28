import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
  const supabase = await createClient()
    
    // Get current user (should be admin or system)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { feedback_id } = body

    if (!feedback_id) {
      return NextResponse.json({ error: 'Feedback ID is required' }, { status: 400 })
    }

    // Get feedback record
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select(`
        *,
        client_signups!inner(first_name, last_name, email),
        classes(name, instructor_id),
        training_sessions(name, trainer_id)
      `)
      .eq('id', feedback_id)
      .eq('status', 'pending')
      .single()

    if (feedbackError || !feedback) {
      return NextResponse.json({ error: 'Feedback not found or already processed' }, { status: 404 })
    }

    if (feedback.feedback_type !== 'voice' || !feedback.voice_recording_url) {
      return NextResponse.json({ error: 'No voice recording to process' }, { status: 400 })
    }

    // Simulate AI processing (in production, this would call OpenAI or similar)
    const aiProcessedFeedback = await processVoiceWithAI(feedback.voice_recording_url)
    
    // Update feedback with AI results
    const { error: updateError } = await supabase
      .from('feedback')
      .update({
        ai_processed_feedback: aiProcessedFeedback.transcription,
        ai_sentiment: aiProcessedFeedback.sentiment,
        ai_key_points: aiProcessedFeedback.keyPoints,
        ai_recommendations: aiProcessedFeedback.recommendations,
        status: 'processed'
      })
      .eq('id', feedback_id)

    if (updateError) {
      console.error('Error updating feedback with AI results:', updateError)
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
    }

    // Send email to admin
    await sendFeedbackEmailToAdmin(feedback, aiProcessedFeedback)

    // Update feedback status to sent
    await supabase
      .from('feedback')
      .update({
        status: 'sent_to_admin',
        admin_email_sent: true,
        admin_email_sent_at: new Date().toISOString()
      })
      .eq('id', feedback_id)

    return NextResponse.json({
      success: true,
      message: 'Feedback processed and sent to admin',
      ai_results: aiProcessedFeedback
    })

  } catch (error) {
    console.error('Error in AI processing:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processVoiceWithAI(audioUrl: string) {
  // This is a simulation - in production, you would:
  // 1. Download the audio file from the URL
  // 2. Send it to OpenAI Whisper API for transcription
  // 3. Send the transcription to OpenAI GPT for analysis
  // 4. Return structured results

  // Simulated AI processing results
  return {
    transcription: "The class was really great today. I felt challenged but not overwhelmed. The instructor was very supportive and helped me with proper form. I'm looking forward to the next session.",
    sentiment: "positive",
    keyPoints: [
      "Class was challenging but manageable",
      "Instructor was supportive",
      "Proper form guidance was provided",
      "Client is looking forward to next session"
    ],
    recommendations: [
      "Continue with current difficulty level",
      "Maintain focus on form instruction",
      "Consider scheduling follow-up session"
    ]
  }
}

async function sendFeedbackEmailToAdmin(feedback: any, aiResults: any) {
  // This would integrate with your email service (Resend, SendGrid, etc.)
  // For now, we'll just log the email content
  
  const emailContent = `
    New Client Feedback Processed
    
    Client: ${feedback.client_signups.first_name} ${feedback.client_signups.last_name}
    Email: ${feedback.client_signups.email}
    Class/Session: ${feedback.classes?.name || feedback.training_sessions?.name || 'N/A'}
    Date: ${new Date(feedback.created_at).toLocaleDateString()}
    
    AI Transcription: ${aiResults.transcription}
    
    Sentiment: ${aiResults.sentiment}
    
    Key Points:
    ${aiResults.keyPoints.map((point: string) => `- ${point}`).join('\n')}
    
    Recommendations:
    ${aiResults.recommendations.map((rec: string) => `- ${rec}`).join('\n')}
  `

  console.log('Email to admin:', emailContent)
  
  // In production, send actual email here
  // Example with Resend:
  /*
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'feedback@penguinfitness.com',
    to: ['admin@penguinfitness.com'],
    subject: 'New Client Feedback - AI Processed',
    html: emailContent
  })
  */
}
