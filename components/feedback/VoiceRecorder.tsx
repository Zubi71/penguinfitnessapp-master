'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Play, Pause, Square, Upload, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void
  maxDuration?: number // in seconds
  disabled?: boolean
}

export default function VoiceRecorder({ 
  onRecordingComplete, 
  maxDuration = 300, // 5 minutes default
  disabled = false 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        onRecordingComplete(blob, recordingTime)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)

      toast.success('Recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      
      toast.success('Recording stopped')
    }
  }

  const playRecording = () => {
    if (audioElementRef.current && audioUrl) {
      audioElementRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseRecording = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      setIsPlaying(false)
    }
  }

  const deleteRecording = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    setIsPlaying(false)
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    
    toast.success('Recording deleted')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const uploadToStorage = async (blob: Blob): Promise<string> => {
    // In production, upload to Supabase Storage or similar
    // For now, we'll simulate the upload
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`https://storage.example.com/feedback/${Date.now()}.wav`)
      }, 1000)
    })
  }

  const handleSubmit = async () => {
    if (!audioBlob) return

    setUploading(true)
    try {
      const audioUrl = await uploadToStorage(audioBlob)
      toast.success('Recording uploaded successfully')
      // The parent component will handle the actual submission
    } catch (error) {
      console.error('Error uploading recording:', error)
      toast.error('Failed to upload recording')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Feedback Recorder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Status */}
        <div className="text-center">
          <div className="text-2xl font-mono mb-2">
            {formatTime(recordingTime)}
          </div>
          <Progress 
            value={(recordingTime / maxDuration) * 100} 
            className="w-full"
          />
          <p className="text-sm text-gray-500 mt-1">
            Max duration: {formatTime(maxDuration)}
          </p>
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center gap-2">
          {!audioBlob ? (
            <>
              {!isRecording ? (
                <Button
                  onClick={startRecording}
                  disabled={disabled}
                  className="bg-red-500 hover:bg-red-600"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Recording
                </Button>
              )}
            </>
          ) : (
            <div className="flex gap-2">
              {!isPlaying ? (
                <Button onClick={playRecording} variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Play
                </Button>
              ) : (
                <Button onClick={pauseRecording} variant="outline">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button onClick={deleteRecording} variant="outline">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={uploading}
                className="bg-green-500 hover:bg-green-600"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Submit'}
              </Button>
            </div>
          )}
        </div>

        {/* Audio Element for Playback */}
        {audioUrl && (
          <audio
            ref={audioElementRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            className="hidden"
          />
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Click "Start Recording" to begin</li>
            <li>Speak clearly about your class experience</li>
            <li>Click "Stop Recording" when finished</li>
            <li>Review your recording before submitting</li>
          </ul>
        </div>

        {/* Recording Status Indicator */}
        {isRecording && (
          <div className="flex items-center justify-center gap-2 text-red-500">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Recording in progress...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
