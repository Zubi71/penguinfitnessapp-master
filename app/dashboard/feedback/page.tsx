'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { MessageSquare, User, Calendar, Star, Mic, FileText, Filter, Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Feedback {
  id: string
  feedback_type: string
  rating?: number
  text_feedback?: string
  voice_recording_url?: string
  voice_duration_seconds?: number
  ai_processed_feedback?: string
  ai_sentiment?: string
  ai_key_points?: string[]
  ai_recommendations?: string[]
  status: string
  admin_email_sent: boolean
  created_at: string
  client_signups: {
    first_name: string
    last_name: string
    email: string
  }
  classes?: {
    name: string
  }
  training_sessions?: {
    name: string
  }
  trainers?: {
    first_name: string
    last_name: string
  }
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchFeedback()
  }, [filterStatus, filterType])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('feedback')
        .select(`
          *,
          client_signups!inner(first_name, last_name, email),
          classes(name),
          training_sessions(name),
          trainers(first_name, last_name)
        `)
        .order('created_at', { ascending: false })

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      if (filterType !== 'all') {
        query = query.eq('feedback_type', filterType)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching feedback:', error)
        toast.error('Failed to fetch feedback')
        return
      }

      setFeedback(data || [])
    } catch (error) {
      console.error('Error in fetchFeedback:', error)
      toast.error('Failed to fetch feedback')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessAI = async (feedbackId: string) => {
    try {
      const response = await fetch('/api/feedback/process-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback_id: feedbackId }),
      })

      if (!response.ok) {
        throw new Error('Failed to process feedback')
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Feedback processed successfully')
        fetchFeedback() // Refresh the list
      } else {
        throw new Error(result.error || 'Failed to process feedback')
      }
    } catch (error) {
      console.error('Error processing feedback:', error)
      toast.error('Failed to process feedback')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processed': return 'bg-blue-100 text-blue-800'
      case 'sent_to_admin': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800'
      case 'neutral': return 'bg-gray-100 text-gray-800'
      case 'negative': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'voice': return <Mic className="h-4 w-4" />
      case 'text': return <FileText className="h-4 w-4" />
      case 'rating': return <Star className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5d90]"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Client Feedback</h1>
        <div className="flex items-center space-x-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
              <SelectItem value="sent_to_admin">Sent to Admin</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="voice">Voice</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {feedback.map((item) => (
          <Card key={item.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getFeedbackTypeIcon(item.feedback_type)}
                  {item.client_signups.first_name} {item.client_signups.last_name}
                </CardTitle>
                <div className="flex space-x-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFeedback(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Feedback Details</DialogTitle>
                        <DialogDescription>
                          Detailed view of client feedback
                        </DialogDescription>
                      </DialogHeader>
                      {selectedFeedback && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold">Client Information</h4>
                            <p>{selectedFeedback.client_signups.first_name} {selectedFeedback.client_signups.last_name}</p>
                            <p className="text-sm text-gray-600">{selectedFeedback.client_signups.email}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold">Class/Session</h4>
                            <p>{selectedFeedback.classes?.name || selectedFeedback.training_sessions?.name || 'N/A'}</p>
                          </div>

                          <div>
                            <h4 className="font-semibold">Feedback Type</h4>
                            <Badge className="capitalize">{selectedFeedback.feedback_type}</Badge>
                          </div>

                          {selectedFeedback.rating && (
                            <div>
                              <h4 className="font-semibold">Rating</h4>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-5 w-5 ${
                                      star <= selectedFeedback.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                                <span className="ml-2">({selectedFeedback.rating}/5)</span>
                              </div>
                            </div>
                          )}

                          {selectedFeedback.text_feedback && (
                            <div>
                              <h4 className="font-semibold">Text Feedback</h4>
                              <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedFeedback.text_feedback}</p>
                            </div>
                          )}

                          {selectedFeedback.voice_recording_url && (
                            <div>
                              <h4 className="font-semibold">Voice Recording</h4>
                              <audio controls className="w-full">
                                <source src={selectedFeedback.voice_recording_url} type="audio/wav" />
                                Your browser does not support the audio element.
                              </audio>
                              <p className="text-sm text-gray-600 mt-1">
                                Duration: {Math.floor((selectedFeedback.voice_duration_seconds || 0) / 60)}:
                                {((selectedFeedback.voice_duration_seconds || 0) % 60).toString().padStart(2, '0')}
                              </p>
                            </div>
                          )}

                          {selectedFeedback.ai_processed_feedback && (
                            <div>
                              <h4 className="font-semibold">AI Processing Results</h4>
                              <div className="space-y-3">
                                <div>
                                  <h5 className="font-medium">Transcription</h5>
                                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedFeedback.ai_processed_feedback}</p>
                                </div>
                                
                                <div>
                                  <h5 className="font-medium">Sentiment</h5>
                                  <Badge className={getSentimentColor(selectedFeedback.ai_sentiment || 'neutral')}>
                                    {selectedFeedback.ai_sentiment}
                                  </Badge>
                                </div>

                                {selectedFeedback.ai_key_points && selectedFeedback.ai_key_points.length > 0 && (
                                  <div>
                                    <h5 className="font-medium">Key Points</h5>
                                    <ul className="list-disc list-inside space-y-1">
                                      {selectedFeedback.ai_key_points.map((point, index) => (
                                        <li key={index} className="text-gray-700">{point}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {selectedFeedback.ai_recommendations && selectedFeedback.ai_recommendations.length > 0 && (
                                  <div>
                                    <h5 className="font-medium">Recommendations</h5>
                                    <ul className="list-disc list-inside space-y-1">
                                      {selectedFeedback.ai_recommendations.map((rec, index) => (
                                        <li key={index} className="text-gray-700">{rec}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(item.status)}>
                  {item.status}
                </Badge>
                {item.ai_sentiment && (
                  <Badge className={getSentimentColor(item.ai_sentiment)}>
                    {item.ai_sentiment}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(item.created_at)}
                </div>
                
                {item.rating && (
                  <div className="flex items-center text-gray-600">
                    <Star className="h-4 w-4 mr-2" />
                    Rating: {item.rating}/5
                  </div>
                )}

                {item.text_feedback && (
                  <p className="text-gray-600 line-clamp-2">
                    "{item.text_feedback}"
                  </p>
                )}

                {item.voice_recording_url && !item.ai_processed_feedback && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Voice recording available</span>
                    <Button
                      size="sm"
                      onClick={() => handleProcessAI(item.id)}
                      disabled={item.status !== 'pending'}
                    >
                      Process with AI
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {feedback.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Feedback Found</h3>
          <p className="text-gray-600">
            {filterStatus !== 'all' || filterType !== 'all' 
              ? 'Try adjusting your filters to see more results.'
              : 'No client feedback has been submitted yet.'
            }
          </p>
        </div>
      )}
    </div>
  )
}
