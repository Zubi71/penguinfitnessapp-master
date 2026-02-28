'use client'

import React, { useState } from 'react'
import { MessageSquare, Star, Mic, Send, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import VoiceRecorder from './VoiceRecorder'
import { toast } from 'sonner'

interface FeedbackFormProps {
  classId?: string
  sessionId?: string
  trainerId?: string
  className?: string
  sessionName?: string
  trainerName?: string
  onSubmit?: (feedback: any) => void
}

export default function FeedbackForm({
  classId,
  sessionId,
  trainerId,
  className,
  sessionName,
  trainerName,
  onSubmit
}: FeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState<'voice' | 'text' | 'rating'>('voice')
  const [rating, setRating] = useState<number>(0)
  const [textFeedback, setTextFeedback] = useState('')
  const [voiceRecordingUrl, setVoiceRecordingUrl] = useState<string | null>(null)
  const [voiceDuration, setVoiceDuration] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleVoiceRecordingComplete = (audioBlob: Blob, duration: number) => {
    // In production, upload to storage and get URL
    const url = URL.createObjectURL(audioBlob)
    setVoiceRecordingUrl(url)
    setVoiceDuration(duration)
  }

  const handleSubmit = async () => {
    if (feedbackType === 'voice' && !voiceRecordingUrl) {
      toast.error('Please record your voice feedback first')
      return
    }

    if (feedbackType === 'text' && !textFeedback.trim()) {
      toast.error('Please enter your text feedback')
      return
    }

    if (feedbackType === 'rating' && rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setSubmitting(true)

    try {
      const feedbackData = {
        class_id: classId,
        session_id: sessionId,
        trainer_id: trainerId,
        feedback_type: feedbackType,
        rating: feedbackType === 'rating' ? rating : undefined,
        text_feedback: feedbackType === 'text' ? textFeedback : undefined,
        voice_recording_url: feedbackType === 'voice' ? voiceRecordingUrl : undefined,
        voice_duration_seconds: feedbackType === 'voice' ? voiceDuration : undefined
      }

      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Feedback submitted successfully!')
        setSubmitted(true)
        
        if (onSubmit) {
          onSubmit(feedbackData)
        }
      } else {
        throw new Error(result.error || 'Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderRatingStars = () => {
    return (
      <div className="flex justify-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-3xl transition-colors ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } hover:text-yellow-400`}
          >
            <Star className="h-8 w-8 fill-current" />
          </button>
        ))}
      </div>
    )
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Thank You!
          </h3>
          <p className="text-gray-600">
            Your feedback has been submitted successfully. We appreciate your input!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Class Feedback
        </CardTitle>
        <div className="text-sm text-gray-600">
          {className && <p>Class: {className}</p>}
          {sessionName && <p>Session: {sessionName}</p>}
          {trainerName && <p>Trainer: {trainerName}</p>}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Feedback Type Selection */}
        <div className="space-y-3">
          <Label>How would you like to provide feedback?</Label>
          <RadioGroup
            value={feedbackType}
            onValueChange={(value: 'voice' | 'text' | 'rating') => setFeedbackType(value)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="voice" id="voice" />
              <Label htmlFor="voice" className="flex items-center gap-2 cursor-pointer">
                <Mic className="h-4 w-4" />
                Voice Recording
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="text" />
              <Label htmlFor="text" className="flex items-center gap-2 cursor-pointer">
                <MessageSquare className="h-4 w-4" />
                Text Feedback
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rating" id="rating" />
              <Label htmlFor="rating" className="flex items-center gap-2 cursor-pointer">
                <Star className="h-4 w-4" />
                Star Rating
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Voice Recording */}
        {feedbackType === 'voice' && (
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecordingComplete}
            maxDuration={300} // 5 minutes
          />
        )}

        {/* Text Feedback */}
        {feedbackType === 'text' && (
          <div className="space-y-3">
            <Label htmlFor="textFeedback">Your Feedback</Label>
            <Textarea
              id="textFeedback"
              value={textFeedback}
              onChange={(e) => setTextFeedback(e.target.value)}
              placeholder="Tell us about your experience in this class..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-sm text-gray-500">
              {textFeedback.length}/1000 characters
            </p>
          </div>
        )}

        {/* Star Rating */}
        {feedbackType === 'rating' && (
          <div className="space-y-3">
            <Label>Rate your experience</Label>
            {renderRatingStars()}
            <p className="text-center text-sm text-gray-600">
              {rating > 0 && (
                rating === 1 ? 'Poor' :
                rating === 2 ? 'Fair' :
                rating === 3 ? 'Good' :
                rating === 4 ? 'Very Good' :
                'Excellent'
              )}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>

        {/* Privacy Notice */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Privacy Notice:</p>
          <p>
            Your feedback helps us improve our services. Voice recordings are processed 
            by AI to extract insights and will be shared with your trainer and admin team.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
