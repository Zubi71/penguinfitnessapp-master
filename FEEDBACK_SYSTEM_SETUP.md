# Feedback System Setup Guide

This guide will help you set up the complete feedback system with voice recording and AI processing for your fitness app.

## Overview

The feedback system allows clients to:
- Record voice feedback after classes
- Provide text feedback
- Give star ratings
- AI processes voice recordings and sends insights to admin

## Database Setup

### 1. Run the Database Schema

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/feedback_schema.sql`
4. Click "Run" to create the feedback tables

### 2. Verify Tables Created

After running the schema, you should see these new tables:
- `feedback` - Stores all feedback submissions
- `feedback_settings` - Admin configuration settings

## API Endpoints

The system includes these API endpoints:

### `/api/feedback/submit` (POST)
- Accepts feedback submissions from clients
- Supports voice, text, and rating feedback types
- Validates user permissions and data

### `/api/feedback/process-ai` (POST)
- Processes voice recordings with AI
- Generates transcriptions and insights
- Sends email notifications to admin

## Components

### VoiceRecorder Component
- Records audio using browser MediaRecorder API
- Supports playback and deletion
- Configurable duration limits
- Uploads to storage (needs implementation)

### FeedbackForm Component
- Main feedback interface for clients
- Supports multiple feedback types
- Handles form submission and validation

## Client Interface

### Access Points
1. **Client Dashboard**: Added "Class Feedback" button
2. **Direct URL**: `/client/feedback`
3. **After Class**: Can be triggered automatically

### Features
- View recent classes (last 7 days)
- Select class to provide feedback
- Choose feedback type (voice/text/rating)
- Record voice feedback with playback
- Submit and receive confirmation

## Admin Interface

### Access Points
1. **Admin Dashboard**: `/dashboard/feedback`
2. **Direct URL**: `/dashboard/feedback`

### Features
- View all client feedback
- Filter by status and type
- Process voice recordings with AI
- View detailed feedback with AI insights
- Export feedback data

## AI Processing Setup

### Current Implementation
The system includes a simulated AI processing function. To implement real AI:

### 1. OpenAI Integration (Recommended)

```typescript
// In app/api/feedback/process-ai/route.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function processVoiceWithAI(audioUrl: string) {
  // 1. Download audio file
  const audioBuffer = await downloadAudio(audioUrl)
  
  // 2. Transcribe with Whisper
  const transcription = await openai.audio.transcriptions.create({
    file: audioBuffer,
    model: "whisper-1",
  })
  
  // 3. Analyze with GPT
  const analysis = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Analyze this fitness class feedback and provide: 1) Sentiment (positive/neutral/negative), 2) Key points, 3) Recommendations for improvement"
      },
      {
        role: "user",
        content: transcription.text
      }
    ]
  })
  
  return {
    transcription: transcription.text,
    sentiment: extractSentiment(analysis.choices[0].message.content),
    keyPoints: extractKeyPoints(analysis.choices[0].message.content),
    recommendations: extractRecommendations(analysis.choices[0].message.content)
  }
}
```

### 2. Environment Variables

Add to your `.env.local`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## Email Integration

### Current Implementation
The system logs email content to console. To implement real email sending:

### 1. Resend Integration

```typescript
// In app/api/feedback/process-ai/route.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendFeedbackEmailToAdmin(feedback: any, aiResults: any) {
  const emailContent = `
    <h2>New Client Feedback Processed</h2>
    <p><strong>Client:</strong> ${feedback.client_signups.first_name} ${feedback.client_signups.last_name}</p>
    <p><strong>Email:</strong> ${feedback.client_signups.email}</p>
    <p><strong>Class/Session:</strong> ${feedback.classes?.name || feedback.training_sessions?.name || 'N/A'}</p>
    <p><strong>Date:</strong> ${new Date(feedback.created_at).toLocaleDateString()}</p>
    
    <h3>AI Transcription</h3>
    <p>${aiResults.transcription}</p>
    
    <h3>Sentiment</h3>
    <p>${aiResults.sentiment}</p>
    
    <h3>Key Points</h3>
    <ul>
      ${aiResults.keyPoints.map((point: string) => `<li>${point}</li>`).join('')}
    </ul>
    
    <h3>Recommendations</h3>
    <ul>
      ${aiResults.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
    </ul>
  `

  await resend.emails.send({
    from: 'feedback@penguinfitness.com',
    to: ['admin@penguinfitness.com'],
    subject: 'New Client Feedback - AI Processed',
    html: emailContent
  })
}
```

### 2. Environment Variables

Add to your `.env.local`:
```
RESEND_API_KEY=your_resend_api_key_here
```

## Storage Setup

### Current Implementation
The system simulates file upload. To implement real storage:

### 1. Supabase Storage

```typescript
// In components/feedback/VoiceRecorder.tsx
const uploadToStorage = async (blob: Blob): Promise<string> => {
  const fileName = `feedback/${Date.now()}.wav`
  
  const { data, error } = await supabase.storage
    .from('audio-feedback')
    .upload(fileName, blob, {
      contentType: 'audio/wav'
    })
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from('audio-feedback')
    .getPublicUrl(fileName)
  
  return publicUrl
}
```

### 2. Storage Bucket Setup

1. In Supabase dashboard, go to Storage
2. Create a new bucket called `audio-feedback`
3. Set bucket to public or configure RLS policies
4. Update bucket settings for audio files

## Testing the System

### 1. Test Client Feedback
1. Log in as a client
2. Go to `/client/feedback`
3. Select a recent class
4. Try recording voice feedback
5. Submit and verify it appears in admin

### 2. Test Admin Interface
1. Log in as admin
2. Go to `/dashboard/feedback`
3. View submitted feedback
4. Test AI processing (if implemented)
5. Check email notifications

### 3. Test Voice Recording
1. Ensure microphone permissions are granted
2. Test recording functionality
3. Verify playback works
4. Check file upload (if implemented)

## Troubleshooting

### Common Issues

1. **Microphone not working**
   - Check browser permissions
   - Ensure HTTPS (required for media access)
   - Test in different browsers

2. **AI processing fails**
   - Verify OpenAI API key
   - Check API rate limits
   - Review error logs

3. **Email not sending**
   - Verify Resend API key
   - Check email configuration
   - Review spam settings

4. **Storage upload fails**
   - Verify Supabase storage bucket
   - Check RLS policies
   - Review file size limits

### Debug Mode

Enable debug logging by adding to your environment:
```
DEBUG_FEEDBACK=true
```

## Security Considerations

1. **File Upload Security**
   - Validate file types
   - Set size limits
   - Scan for malware

2. **Privacy Protection**
   - Encrypt sensitive data
   - Implement data retention policies
   - Comply with GDPR/CCPA

3. **Access Control**
   - Verify user permissions
   - Implement rate limiting
   - Audit access logs

## Performance Optimization

1. **Audio Processing**
   - Compress audio files
   - Use streaming for large files
   - Implement caching

2. **AI Processing**
   - Queue long-running tasks
   - Implement retry logic
   - Monitor API usage

3. **Database**
   - Add appropriate indexes
   - Implement pagination
   - Archive old feedback

## Future Enhancements

1. **Real-time Processing**
   - WebSocket notifications
   - Live transcription
   - Instant feedback

2. **Advanced Analytics**
   - Sentiment trends
   - Trainer performance metrics
   - Class improvement suggestions

3. **Mobile App Integration**
   - Native recording
   - Offline support
   - Push notifications

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review error logs
3. Test with different browsers/devices
4. Contact development team

---

**Note**: This system is designed to be scalable and secure. Always test thoroughly in a staging environment before deploying to production.
