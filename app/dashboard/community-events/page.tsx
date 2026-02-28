'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, Calendar, MapPin, Clock, Star } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface CommunityEvent {
  id: string
  title: string
  description: string
  event_date: string
  start_time: string
  end_time: string
  location: string
  max_participants: number | null
  current_participants: number
  event_type: string
  difficulty_level: string
  price: number
  image_url: string | null
  status: string
  is_featured: boolean
  created_at: string
}

export default function CommunityEventsPage() {
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    location: '',
    max_participants: '',
    event_type: 'community',
    difficulty_level: 'all',
    price: '0',
    image_url: '',
    status: 'active',
    is_featured: false
  })

  const supabase = createClient()

  const fetchEvents = async () => {
    try {
      setLoading(true)
             const { data, error } = await supabase
         .from('community_events')
         .select('*')
         .order('event_date', { ascending: true })
         .order('start_time', { ascending: true })

      if (error) {
        console.error('Error fetching events:', error)
        toast.error('Failed to fetch events')
        return
      }

      setEvents(data || [])
    } catch (error) {
      console.error('Error in fetchEvents:', error)
      toast.error('Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('community_events')
        .insert([{
          ...formData,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
          price: parseFloat(formData.price),
          is_featured: formData.is_featured
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating event:', error)
        toast.error('Failed to create event')
        return
      }

      toast.success('Event created successfully')
      setShowCreateModal(false)
      resetForm()
      fetchEvents()
    } catch (error) {
      console.error('Error in handleCreateEvent:', error)
      toast.error('Failed to create event')
    }
  }

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return

    try {
      const { data, error } = await supabase
        .from('community_events')
        .update({
          ...formData,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
          price: parseFloat(formData.price),
          is_featured: formData.is_featured
        })
        .eq('id', selectedEvent.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating event:', error)
        toast.error('Failed to update event')
        return
      }

      toast.success('Event updated successfully')
      setShowEditModal(false)
      setSelectedEvent(null)
      resetForm()
      fetchEvents()
    } catch (error) {
      console.error('Error in handleUpdateEvent:', error)
      toast.error('Failed to update event')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const { error } = await supabase
        .from('community_events')
        .delete()
        .eq('id', eventId)

      if (error) {
        console.error('Error deleting event:', error)
        toast.error('Failed to delete event')
        return
      }

      toast.success('Event deleted successfully')
      fetchEvents()
    } catch (error) {
      console.error('Error in handleDeleteEvent:', error)
      toast.error('Failed to delete event')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      start_time: '',
      end_time: '',
      location: '',
      max_participants: '',
      event_type: 'community',
      difficulty_level: 'all',
      price: '0',
      image_url: '',
      status: 'active',
      is_featured: false
    })
  }

  const openEditModal = (event: CommunityEvent) => {
    setSelectedEvent(event)
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: event.event_date,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location,
      max_participants: event.max_participants?.toString() || '',
      event_type: event.event_type,
      difficulty_level: event.difficulty_level,
      price: event.price.toString(),
      image_url: event.image_url || '',
      status: event.status,
      is_featured: event.is_featured
    })
    setShowEditModal(true)
  }



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

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
        <h1 className="text-3xl font-bold text-gray-900">Community Events</h1>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Community Event</DialogTitle>
              <DialogDescription>
                Fill in the details below to create a new community event.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter event description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="event_date">Event Date *</Label>
                <Input
                  id="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter event location"
                />
              </div>
              <div>
                <Label htmlFor="max_participants">Max Participants</Label>
                <Input
                  id="max_participants"
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                  placeholder="Leave empty for unlimited"
                />
              </div>
              <div>
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="difficulty_level">Difficulty Level</Label>
                <Select value={formData.difficulty_level} onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEvent}>
                Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="relative">
            {event.is_featured && (
              <div className="absolute top-2 right-2">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(event)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(event.status)}>
                  {event.status}
                </Badge>
                {event.price > 0 && (
                  <Badge variant="secondary">
                    ${event.price}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {event.description || 'No description provided'}
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(event.event_date).toLocaleDateString()}
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  {event.start_time} - {event.end_time}
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.location}
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  {event.current_participants}
                  {event.max_participants && ` / ${event.max_participants}`} participants
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No community events found</p>
          <p className="text-gray-400 mt-2">Create your first event to get started</p>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                  <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Community Event</DialogTitle>
              <DialogDescription>
                Update the details of this community event.
              </DialogDescription>
            </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="edit-title">Event Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter event title"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter event description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-event_date">Event Date *</Label>
              <Input
                id="edit-event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-start_time">Start Time *</Label>
              <Input
                id="edit-start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-end_time">End Time *</Label>
              <Input
                id="edit-end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="edit-location">Location *</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter event location"
              />
            </div>
            <div>
              <Label htmlFor="edit-max_participants">Max Participants</Label>
              <Input
                id="edit-max_participants"
                type="number"
                value={formData.max_participants}
                onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                placeholder="Leave empty for unlimited"
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Price ($)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="edit-difficulty_level">Difficulty Level</Label>
              <Select value={formData.difficulty_level} onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEvent}>
              Update Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
