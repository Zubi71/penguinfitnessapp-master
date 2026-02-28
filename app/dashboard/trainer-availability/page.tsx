'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Clock, Search, Users, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

interface Trainer {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface Availability {
  id: string
  day_of_week: string
  start_time?: string | null
  end_time?: string | null
  trainer: Trainer
}

// Convert 24-hour time to 12-hour format
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
  const [timePart, period] = time12.split(' ')
  const [hours, minutes] = timePart.split(':')
  let hour24 = parseInt(hours)
  if (period === 'PM' && hour24 !== 12) hour24 += 12
  if (period === 'AM' && hour24 === 12) hour24 = 0
  return `${hour24.toString().padStart(2, '0')}:${minutes}`
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

// Format time range for display
function formatTimeRange(start: string | null, end: string | null): string {
  if (!start && !end) return 'Free all day'
  if (!start) return `Until ${formatTime24To12(end!)}`
  if (!end) return `From ${formatTime24To12(start)}`
  return `${formatTime24To12(start)} - ${formatTime24To12(end)}`
}

export default function AdminTrainerAvailabilityPage() {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [availableTrainers, setAvailableTrainers] = useState<Availability[]>([])
  const [allAvailabilities, setAllAvailabilities] = useState<Availability[]>([])
  const [loading, setLoading] = useState(true)
  const timeOptions = generateTimeOptions()

  useEffect(() => {
    fetchAllAvailabilities()
  }, [])

  useEffect(() => {
    if (selectedDay && selectedTime) {
      searchAvailableTrainers()
    } else {
      setAvailableTrainers([])
    }
  }, [selectedDay, selectedTime])

  const handleTimeChange = (time: string) => {
    setSelectedTime(time)
  }

  const fetchAllAvailabilities = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/trainer-availability', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch availability')
      }

      const data = await response.json()
      setAllAvailabilities(data)
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const searchAvailableTrainers = async () => {
    if (!selectedDay || !selectedTime) return

    try {
      const time24 = formatTime12To24(selectedTime)
      const [hours, minutes] = time24.split(':')
      const queryTime = `${hours}:${minutes}`

      const response = await fetch(
        `/api/trainer-availability?day_of_week=${selectedDay}&time=${queryTime}`,
        {
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error('Failed to search trainers')
      }

      const data = await response.json()
      setAvailableTrainers(data)
    } catch (error) {
      console.error('Error searching trainers:', error)
      setAvailableTrainers([])
    }
  }

  // Group availabilities by trainer and day
  const groupedAvailabilities = allAvailabilities.reduce((acc, availability) => {
    const key = `${availability.trainer.id}-${availability.day_of_week}`
    if (!acc[key]) {
      acc[key] = {
        trainer: availability.trainer,
        day: availability.day_of_week,
        slots: []
      }
    }
    acc[key].slots.push({
      id: availability.id,
      start_time: availability.start_time ?? null,
      end_time: availability.end_time ?? null
    })
    return acc
  }, {} as Record<string, { trainer: Trainer; day: string; slots: Array<{ id: string; start_time: string | null; end_time: string | null }> }>)

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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header - Responsive */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Trainer Availability</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">View trainers available at specific days and times</p>
        </div>

        {/* Search Section - Responsive */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-[#2a5d90]" />
              Search Available Trainers
            </CardTitle>
            <CardDescription className="text-sm">
              Select a day and time to see which trainers are available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="day-select" className="text-sm font-medium">
                  Day of Week
                </Label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
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

              <div>
                <Label htmlFor="time-select" className="text-sm font-medium">
                  Time (12-hour format)
                </Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <Select value={selectedTime} onValueChange={handleTimeChange}>
                    <SelectTrigger id="time-select" className="flex-1 h-10 sm:h-9">
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
            {selectedDay && selectedTime && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs sm:text-sm text-gray-600">
                  <Search className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                  Searching for trainers available on <strong>{selectedDay}</strong> at <strong>{selectedTime}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section - Responsive */}
        {selectedDay && selectedTime && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-[#2a5d90]" />
                Available Trainers
              </CardTitle>
              <CardDescription className="text-sm">
                Trainers available on {selectedDay} at {selectedTime}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableTrainers.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {availableTrainers.map((availability) => (
                    <div
                      key={availability.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                          {availability.trainer.first_name} {availability.trainer.last_name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">{availability.trainer.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Available: {formatTimeRange(availability.start_time ?? null, availability.end_time ?? null)}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 w-fit">
                        Available
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm sm:text-base">No trainers available at this time</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Trainer Schedules - Responsive */}
        <Card className="mt-4 sm:mt-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#2a5d90]" />
              All Trainer Schedules
            </CardTitle>
            <CardDescription className="text-sm">
              View all trainer availability schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-6">
              {DAYS_OF_WEEK.map(day => {
                const dayAvailabilities = Object.values(groupedAvailabilities).filter(
                  item => item.day === day
                )
                if (dayAvailabilities.length === 0) return null

                return (
                  <div key={day} className="border-b pb-3 sm:pb-4 last:border-b-0">
                    <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">{day}</h3>
                    <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {dayAvailabilities.map(({ trainer, slots }) => (
                        <div
                          key={`${trainer.id}-${day}`}
                          className="p-2 sm:p-3 bg-gray-50 rounded border"
                        >
                          <p className="font-medium text-gray-900 text-sm sm:text-base">
                            {trainer.first_name} {trainer.last_name}
                          </p>
                          <div className="text-gray-600 text-xs mt-1 space-y-0.5 sm:space-y-1">
                            {slots.map((slot, idx) => (
                              <p key={slot.id || idx}>
                                {formatTimeRange(slot.start_time, slot.end_time)}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {allAvailabilities.length === 0 && (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm sm:text-base">No trainer availability schedules set yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
