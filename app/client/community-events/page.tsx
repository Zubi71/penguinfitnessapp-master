'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, MapPin, Clock, Users, Star, Filter, Search } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Utility function to format time to 12-hour format with AM/PM and no seconds
const formatTime = (timeString: string): string => {
  try {
    // Parse the time string (e.g., "14:30:00" or "14:30")
    const [hours, minutes] = timeString.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      return timeString; // Return original if parsing fails
    }
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${period}`;
  } catch (error) {
    return timeString; // Return original if any error occurs
  }
};

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
  price: number
  image_url: string | null
  status: string
  is_featured: boolean
  created_at: string
  is_registered?: boolean
  registration_status?: 'pending' | 'registered' | 'cancelled' | 'waitlisted'
  invoice_id?: string
}

function ClientCommunityEventsPageContent() {
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<CommunityEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null)
  const [userRegistrations, setUserRegistrations] = useState<Set<string>>(new Set())

  const supabase = createClient()

  const fetchEvents = async () => {
    try {
      setLoading(true)
      
      // Fetch active events using public API
      const eventsResult = await fetch('/api/community-events/public?status=active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!eventsResult.ok) {
        console.error('Error fetching events:', eventsResult.status, eventsResult.statusText)
        toast.error('Failed to fetch events')
        setEvents([])
        setFilteredEvents([])
        return
      }

      let eventsData = []
      try {
        const contentType = eventsResult.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Response is not JSON:', contentType)
          toast.error('Server returned invalid response')
          setEvents([])
          setFilteredEvents([])
          return
        }
        
        eventsData = await eventsResult.json() || []
      } catch (parseError) {
        console.error('Error parsing events response:', parseError)
        toast.error('Failed to parse events data')
        setEvents([])
        setFilteredEvents([])
        return
      }

      // Fetch user's registrations using server-side API
      const registrationsResult = await fetch('/api/community-events/user-registrations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (registrationsResult.ok) {
        let registrationsData = null
        try {
          const contentType = registrationsResult.headers.get('content-type')
          if (!contentType || !contentType.includes('application/json')) {
            console.error('Registrations response is not JSON:', contentType)
            throw new Error('Server returned invalid response')
          }
          
          registrationsData = await registrationsResult.json()
        } catch (parseError) {
          console.error('Error parsing registrations response:', parseError)
          registrationsData = { registrations: [] }
        }
        
        const registrationSet = new Set<string>(registrationsData.registrations?.map((r: any) => r.event_id) || [])
        setUserRegistrations(registrationSet)
        
        // Mark events as registered with status
        const eventsWithRegistration = eventsData.map((event: any) => {
          const registration = registrationsData.registrations?.find((r: any) => r.event_id === event.id)
          return {
            ...event,
            is_registered: registrationSet.has(event.id),
            registration_status: registration?.status || undefined,
            invoice_id: registration?.invoice_id || undefined
          }
        })
        
        setEvents(eventsWithRegistration)
        setFilteredEvents(eventsWithRegistration)
      } else {
        // If registrations API fails, just show events without registration status
        if (registrationsResult.status === 401) {
          console.log('User not authenticated, showing events without registration status')
        } else {
          console.warn('Failed to fetch user registrations, showing events without registration status:', registrationsResult.status, registrationsResult.statusText)
        }
        setEvents(eventsData)
        setFilteredEvents(eventsData)
        setUserRegistrations(new Set())
      }
    } catch (error) {
      console.error('Error in fetchEvents:', error instanceof Error ? error.message : JSON.stringify(error))
      toast.error('Failed to fetch events')
      setEvents([])
      setFilteredEvents([])
      setUserRegistrations(new Set())
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId: string) => {
    try {
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        toast.error('Please log in to register for events')
        return
      }
      
      const result = await fetch(`/api/community-events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!result.ok) {
        let errorMessage = 'Failed to register for event'
        try {
          const contentType = result.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await result.json()
            errorMessage = errorData.error || errorMessage
          } else {
            errorMessage = `Server error (${result.status}): ${result.statusText}`
          }
        } catch {
          errorMessage = `Server error (${result.status}): ${result.statusText}`
        }
        toast.error(errorMessage)
        return
      }

      let data = null
      try {
        const contentType = result.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          toast.error('Server returned invalid response')
          return
        }
        
        data = await result.json()
      } catch (parseError) {
        console.error('Error parsing registration response:', parseError)
        toast.error('Failed to parse registration response')
        return
      }
      
      if (data.checkout_url) {
        toast.success('Redirecting to payment...')
        // Redirect to Stripe checkout
        window.location.href = data.checkout_url
      } else {
        toast.success('Successfully registered for event!')
      }
      
      // Update local state
      setUserRegistrations(prev => new Set([...prev, eventId]))
             setEvents(prev => prev.map(event => 
         event.id === eventId 
           ? { 
               ...event, 
               is_registered: true, 
               registration_status: data.invoice ? 'pending' : 'registered',
               invoice_id: data.invoice?.id,
               current_participants: (event.current_participants || 0) + 1 
             }
           : event
       ))
             setFilteredEvents(prev => prev.map(event => 
         event.id === eventId 
           ? { 
               ...event, 
               is_registered: true, 
               registration_status: data.invoice ? 'pending' : 'registered',
               invoice_id: data.invoice?.id,
               current_participants: (event.current_participants || 0) + 1 
             }
           : event
       ))
    } catch (error) {
      console.error('Error registering for event:', error instanceof Error ? error.message : JSON.stringify(error))
      toast.error('Failed to register for event. Please try again.')
    }
  }

  const handleCancelRegistration = async (eventId: string) => {
    try {
      const result = await fetch(`/api/community-events/${eventId}/register`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!result.ok) {
        let errorMessage = 'Failed to cancel registration'
        try {
          const errorData = await result.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If we can't parse the error response, use the default message
        }
        toast.error(errorMessage)
        return
      }

      toast.success('Registration cancelled successfully')
      
      // Update local state
      setUserRegistrations(prev => {
        const newSet = new Set(prev)
        newSet.delete(eventId)
        return newSet
      })
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, is_registered: false, current_participants: Math.max(0, (event.current_participants || 0) - 1) }
          : event
      ))
      setFilteredEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, is_registered: false, current_participants: Math.max(0, (event.current_participants || 0) - 1) }
          : event
      ))
    } catch (error) {
      console.error('Error cancelling registration:', error instanceof Error ? error.message : JSON.stringify(error))
      toast.error('Failed to cancel registration. Please try again.')
    }
  }

  const filterEvents = () => {
    let filtered = events

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredEvents(filtered)
  }

  const openEventModal = (event: CommunityEvent) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }



  const isEventFull = (event: CommunityEvent) => {
    return !!(event.max_participants && event.current_participants >= event.max_participants)
  }

  const isEventPast = (event: CommunityEvent) => {
    const eventDate = new Date(event.event_date + 'T' + event.start_time)
    return eventDate < new Date()
  }

  const getRegistrationStatusDisplay = (event: CommunityEvent) => {
    if (!event.is_registered) return null
    
    switch (event.registration_status) {
      case 'pending':
        return {
          badge: 'Pending Payment',
          variant: 'bg-yellow-100 text-yellow-800',
          button: 'Pay Invoice'
        }
             case 'registered':
         return {
           badge: 'Registered',
           variant: 'bg-green-100 text-green-800',
           button: 'Cancel'
         }
      case 'cancelled':
        return {
          badge: 'Cancelled',
          variant: 'bg-red-100 text-red-800',
          button: null
        }
      default:
        return {
          badge: 'Registered',
          variant: 'bg-green-100 text-green-800',
          button: 'Cancel'
        }
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [searchTerm, events])

  // Check for payment status in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentStatus = urlParams.get('payment')
    const sessionId = urlParams.get('session_id')
    
    if (paymentStatus === 'success') {
      toast.success('Payment successful! Your registration has been confirmed.')
      // Refresh events to update registration status
      fetchEvents()
    } else if (paymentStatus === 'cancelled') {
      toast.info('Payment was cancelled. You can try again anytime.')
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5d90]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Community Events</h1>
          <p className="text-gray-600 text-sm sm:text-base">Discover and join exciting community events</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
             <Input
               placeholder="Search events..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10"
             />
           </div>

           <div className="flex items-center text-sm text-gray-500">
             <Filter className="h-4 w-4 mr-2" />
             <span className="hidden sm:inline">{filteredEvents.length} events found</span>
             <span className="sm:hidden">{filteredEvents.length} events</span>
           </div>
         </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="relative hover:shadow-lg transition-shadow">
            {event.is_featured && (
              <div className="absolute top-2 right-2 z-10">
                <Star className="h-5 w-5 text-yellow-500 fill-current" />
              </div>
            )}
            <CardHeader className="pb-3">
              <CardTitle 
                className="text-base sm:text-lg cursor-pointer hover:text-[#2a5d90] line-clamp-2" 
                onClick={() => openEventModal(event)}
              >
                {event.title}
              </CardTitle>
                             <div className="flex flex-wrap gap-2">
                 {event.price > 0 && (
                   <Badge variant="secondary" className="text-xs">
                     ${event.price}
                   </Badge>
                 )}
               </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {event.description || 'No description provided'}
              </p>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{new Date(event.event_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{event.location}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">
                    {event.current_participants}
                    {event.max_participants && ` / ${event.max_participants}`} participants
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                {isEventPast(event) ? (
                  <Badge variant="secondary" className="text-xs">Past Event</Badge>
                ) : isEventFull(event) && !event.is_registered ? (
                  <Badge variant="destructive" className="text-xs">Event Full</Badge>
                ) : event.is_registered ? (
                  (() => {
                    const statusDisplay = getRegistrationStatusDisplay(event)
                    if (!statusDisplay) {
                      return <Badge className="bg-gray-100 text-gray-800 text-xs">Registered</Badge>
                    }
                    return (
                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <Badge className={`${statusDisplay.variant} text-xs`}>{statusDisplay.badge}</Badge>
                        {statusDisplay.button && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (statusDisplay.button === 'Pay Invoice') {
                                try {
                                  // Create Stripe checkout session for invoice payment
                                  const response = await fetch('/api/stripe/create-invoice-payment', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      invoiceId: event.invoice_id
                                    })
                                  })

                                  if (response.ok) {
                                    const { url } = await response.json()
                                    // Redirect to Stripe checkout
                                    window.location.href = url
                                  } else {
                                    const errorData = await response.json()
                                    toast.error(errorData.error || 'Unable to create payment session. Please contact support.')
                                  }
                                } catch (error) {
                                  console.error('Payment session error:', error)
                                  toast.error('Unable to create payment session. Please contact support.')
                                }
                              } else {
                                handleCancelRegistration(event.id)
                              }
                            }}
                            className="text-xs"
                          >
                            {statusDisplay.button}
                          </Button>
                        )}
                      </div>
                    )
                  })()
                ) : (
                  <Button
                    onClick={() => handleRegister(event.id)}
                    disabled={isEventFull(event)}
                    className="w-full text-sm"
                  >
                    Register
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No events found</p>
          <p className="text-gray-400 mt-2 text-sm">Try adjusting your filters or check back later</p>
        </div>
      )}

      {/* Event Details Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  {selectedEvent.title}
                  {selectedEvent.is_featured && (
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  )}
                </DialogTitle>
                <DialogDescription>
                  View detailed information about this community event.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                                 <div className="flex flex-wrap gap-2">
                   {selectedEvent.price > 0 && (
                     <Badge variant="secondary">
                       ${selectedEvent.price}
                     </Badge>
                   )}
                 </div>
                
                <p className="text-gray-600 text-sm sm:text-base">
                  {selectedEvent.description || 'No description provided'}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    {new Date(selectedEvent.event_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                    {formatTime(selectedEvent.start_time)} - {formatTime(selectedEvent.end_time)}
                  </div>
                  <div className="flex items-center text-gray-600 sm:col-span-2">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{selectedEvent.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                    {selectedEvent.current_participants}
                    {selectedEvent.max_participants && ` / ${selectedEvent.max_participants}`} participants
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  Organized by: Community Team
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                  {isEventPast(selectedEvent) ? (
                    <Badge variant="secondary">Past Event</Badge>
                  ) : isEventFull(selectedEvent) && !selectedEvent.is_registered ? (
                    <Badge variant="destructive">Event Full</Badge>
                  ) : selectedEvent.is_registered ? (
                    (() => {
                      const statusDisplay = getRegistrationStatusDisplay(selectedEvent)
                      if (!statusDisplay) {
                        return (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Badge className="bg-green-100 text-green-800">Registered</Badge>
                            <Button
                              variant="outline"
                              onClick={() => {
                                handleCancelRegistration(selectedEvent.id)
                                setShowEventModal(false)
                              }}
                            >
                              Cancel Registration
                            </Button>
                          </div>
                        )
                      }
                      return (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Badge className={`${statusDisplay.variant}`}>{statusDisplay.badge}</Badge>
                          {statusDisplay.button && (
                            <Button
                              variant="outline"
                              onClick={async () => {
                                if (statusDisplay.button === 'Pay Invoice') {
                                  try {
                                    // Create Stripe checkout session for invoice payment
                                    const response = await fetch('/api/stripe/create-invoice-payment', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        invoiceId: selectedEvent.invoice_id
                                      })
                                    })

                                    if (response.ok) {
                                      const { url } = await response.json()
                                      // Redirect to Stripe checkout
                                      window.location.href = url
                                    } else {
                                      const errorData = await response.json()
                                      toast.error(errorData.error || 'Unable to create payment session. Please contact support.')
                                    }
                                  } catch (error) {
                                    console.error('Payment session error:', error)
                                    toast.error('Unable to create payment session. Please contact support.')
                                  }
                                } else {
                                  handleCancelRegistration(selectedEvent.id)
                                  setShowEventModal(false)
                                }
                              }}
                            >
                              {statusDisplay.button}
                            </Button>
                          )}
                        </div>
                      )
                    })()
                  ) : (
                    <Button
                      onClick={() => {
                        handleRegister(selectedEvent.id)
                        setShowEventModal(false)
                      }}
                      disabled={isEventFull(selectedEvent)}
                      className="w-full sm:w-auto"
                    >
                      Register for Event
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ClientCommunityEventsPage() {
  return (
    <ErrorBoundary>
      <ClientCommunityEventsPageContent />
    </ErrorBoundary>
  )
}
