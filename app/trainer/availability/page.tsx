'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Save, Trash2, Plus, Calendar, Edit, X } from 'lucide-react'
import UserDropdown from '@/components/UserDropdown'

interface TimeSlot {
  id: string
  day_of_week: string
  start_time: string | null
  end_time: string | null
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Convert 24-hour time to 12-hour format for display
function formatTime24To12(time24: string): string {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

// Convert 12-hour time to 24-hour format
function formatTime12To24(time12: string): string {
  if (!time12) return ''
  // Handle formats like "5", "5 PM", "5:00 PM"
  let timePart = time12.trim()
  let period = ''
  
  // Check if it contains AM/PM
  if (timePart.includes('AM') || timePart.includes('PM')) {
    const parts = timePart.split(/\s*(AM|PM)/i)
    timePart = parts[0].trim()
    period = parts[1]?.toUpperCase() || ''
  } else {
    // Default to PM if no period specified
    period = 'PM'
  }
  
  // Parse hour (handle formats like "5", "5:00")
  const hourMatch = timePart.match(/^(\d{1,2})/)
  if (!hourMatch) return ''
  
  let hour24 = parseInt(hourMatch[1])
  if (period === 'PM' && hour24 !== 12) hour24 += 12
  if (period === 'AM' && hour24 === 12) hour24 = 0
  
  // Default minutes to 00 if not specified
  const minutes = timePart.includes(':') ? timePart.split(':')[1] || '00' : '00'
  
  return `${hour24.toString().padStart(2, '0')}:${minutes}:00`
}

// Generate time options for select dropdown in chronological order
function generateTimeOptions(): string[] {
  const times: string[] = []
  
  // Generate AM times: 12:00 AM, 12:30 AM, 1:00 AM, ..., 11:30 AM
  times.push('12:00 AM')
  times.push('12:30 AM')
  for (let hour = 1; hour <= 11; hour++) {
    times.push(`${hour}:00 AM`)
    times.push(`${hour}:30 AM`)
  }
  
  // Generate PM times: 12:00 PM, 12:30 PM, 1:00 PM, ..., 11:30 PM
  times.push('12:00 PM')
  times.push('12:30 PM')
  for (let hour = 1; hour <= 11; hour++) {
    times.push(`${hour}:00 PM`)
    times.push(`${hour}:30 PM`)
  }
  
  return times
}

export default function TrainerAvailabilityPage() {
  const router = useRouter()
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [trainerName, setTrainerName] = useState<string>('')

  // Form state
  const [formDay, setFormDay] = useState<string>('')
  const [formStartTime, setFormStartTime] = useState<string>('')
  const [formEndTime, setFormEndTime] = useState<string>('')

  const supabase = createClient()
  const timeOptions = generateTimeOptions()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setCurrentUser(user)

      // Fetch trainer name
      const { data: trainerProfile } = await supabase
        .from('trainers')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single()
      
      if (trainerProfile) {
        setTrainerName(`${trainerProfile.first_name || ''} ${trainerProfile.last_name || ''}`.trim())
      }

      // Fetch availability
      const response = await fetch('/api/trainer-availability', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch availability')
      }

      const data = await response.json()
      setSlots(data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormDay('')
    setFormStartTime('')
    setFormEndTime('')
    setEditingSlot(null)
    setShowForm(false)
  }

  const handleAddClick = () => {
    resetForm()
    setShowForm(true)
  }

  const handleEditClick = (slot: TimeSlot) => {
    setEditingSlot(slot)
    setFormDay(slot.day_of_week)
    setFormStartTime(slot.start_time ? formatTime24To12(slot.start_time) : '')
    setFormEndTime(slot.end_time ? formatTime24To12(slot.end_time) : '')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formDay) {
      alert('Please select a day')
      return
    }

    if (!formStartTime && !formEndTime) {
      alert('Please enter at least a start time or end time')
      return
    }

    setSaving(true)
    try {
      const startTime24 = formStartTime ? formatTime12To24(formStartTime) : null
      const endTime24 = formEndTime ? formatTime12To24(formEndTime) : null

      const response = await fetch('/api/trainer-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          id: editingSlot?.id,
          day_of_week: formDay,
          start_time: startTime24,
          end_time: endTime24
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save availability')
      }

      await fetchData()
      resetForm()
    } catch (error) {
      console.error('Error saving availability:', error)
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) {
      return
    }

    try {
      const response = await fetch(`/api/trainer-availability/${slotId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete availability')
      }

      await fetchData()
    } catch (error) {
      console.error('Error deleting availability:', error)
      alert('Failed to delete availability')
    }
  }

  const formatSlotDisplay = (slot: TimeSlot): string => {
    if (!slot.start_time && !slot.end_time) {
      return `${slot.day_of_week} - Free all day`
    }
    if (!slot.start_time) {
      return `${slot.day_of_week} - Until ${formatTime24To12(slot.end_time!)}`
    }
    if (!slot.end_time) {
      return `${slot.day_of_week} - From ${formatTime24To12(slot.start_time)}`
    }
    return `${slot.day_of_week} - ${formatTime24To12(slot.start_time)} - ${formatTime24To12(slot.end_time)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5d90] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading availability...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 pt-2 sm:pt-4 lg:pt-6 pb-4 sm:pb-6 lg:pb-8 w-full">
      {/* Header Section - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            My Availability
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            Manage your available times for coaching.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            onClick={handleAddClick}
            className="bg-[#2a5d90] hover:bg-[#1e4a73] w-full sm:w-auto flex-1 sm:flex-none"
            size="sm"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Availability</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <UserDropdown userEmail={currentUser?.email} />
        </div>
      </div>

      {/* Add/Edit Availability Form - Responsive */}
      {showForm && (
        <Card className="w-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">
              {editingSlot ? 'Edit Availability' : 'Add Availability'}
            </CardTitle>
            <CardDescription className="text-sm">
              Set your availability for a specific day
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <Label htmlFor="day-select" className="text-sm font-medium">
                  Day of Week
                </Label>
                <Select value={formDay} onValueChange={setFormDay}>
                  <SelectTrigger id="day-select" className="mt-1.5 h-10 sm:h-9">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <Label htmlFor="availability-type" className="text-sm font-medium">
                  Availability Type
                </Label>
                <Select value="time-range" disabled>
                  <SelectTrigger id="availability-type" className="mt-1.5 h-10 sm:h-9">
                    <SelectValue>Time range</SelectValue>
                  </SelectTrigger>
                </Select>
              </div>

              <div className="sm:col-span-1">
                <Label htmlFor="start-time" className="text-sm font-medium">
                  Start Time
                </Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <Select value={formStartTime} onValueChange={setFormStartTime}>
                    <SelectTrigger id="start-time" className="flex-1 h-10 sm:h-9">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {timeOptions.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="sm:col-span-1">
                <Label htmlFor="end-time" className="text-sm font-medium">
                  End Time
                </Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <Select value={formEndTime} onValueChange={setFormEndTime}>
                    <SelectTrigger id="end-time" className="flex-1 h-10 sm:h-9">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {timeOptions.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Action Buttons - Responsive */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={saving}
                className="w-full sm:w-auto h-10 sm:h-9"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !formDay || (!formStartTime && !formEndTime)}
                className="bg-[#2a5d90] hover:bg-[#1e4a73] w-full sm:w-auto h-10 sm:h-9"
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Save Availability</span>
                <span className="sm:hidden">Save</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Availability List - Responsive */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Your Availability</CardTitle>
          <CardDescription className="text-sm">
            Currently saved availability slots
          </CardDescription>
        </CardHeader>
        <CardContent>
          {slots.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm sm:text-base">No availability slots set yet</p>
              <p className="text-xs sm:text-sm mt-1">Click "Add Availability" to get started</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                >
                  {/* Slot Info - Responsive */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[#2a5d90] flex-shrink-0" />
                    <span className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {formatSlotDisplay(slot)}
                    </span>
                  </div>
                  
                  {/* Action Buttons - Responsive */}
                  <div className="flex items-center gap-2 sm:gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(slot)}
                      className="flex-1 sm:flex-none h-9 sm:h-8 text-xs sm:text-sm"
                    >
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
                      <span className="sm:inline">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(slot.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none h-9 sm:h-8 px-3 sm:px-2"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="ml-1.5 sm:hidden text-xs">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
