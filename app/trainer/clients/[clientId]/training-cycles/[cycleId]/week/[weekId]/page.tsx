'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Plus, Calendar, Clock, Edit3, Trash2 } from 'lucide-react'

interface TrainingDay {
  id: string
  day_number: number
  day_name: string
  description: string
  exercises: Exercise[]
  is_rest_day: boolean
  status: 'pending' | 'completed'
  completed_at: string | null
}

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  weight: string
  rest_time: string
  notes: string
}

interface TrainingCycle {
  id: string
  name: string
  description: string
  duration_weeks: number
}

export default function WeekManagement() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.clientId as string
  const cycleId = params.cycleId as string
  const weekId = parseInt(params.weekId as string)
  
  const [cycle, setCycle] = useState<TrainingCycle | null>(null)
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDay, setShowAddDay] = useState(false)
  const [newDay, setNewDay] = useState({
    day_name: '',
    description: '',
    is_rest_day: false
  })

  const supabase = createClient()

  useEffect(() => {
    fetchCycleAndWeekData()
  }, [cycleId, weekId])

  const fetchCycleAndWeekData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('No authenticated user found')
        router.push('/login')
        return
      }

      console.log('Fetching data for:', { cycleId, weekId, userId: user.id })

      // Fetch the training cycle
      const { data: cycleData, error: cycleError } = await supabase
        .from('training_programs')
        .select('*')
        .eq('id', cycleId)
        .eq('trainer_id', user.id)
        .single()

      if (cycleError) {
        console.error('Error fetching cycle:', cycleError)
        console.error('Cycle error details:', {
          message: cycleError.message,
          details: cycleError.details,
          hint: cycleError.hint,
          code: cycleError.code
        })
        
        if (cycleError.code === 'PGRST116') {
          alert('Training cycle not found or you do not have permission to access it.')
        } else {
          alert(`Error loading training cycle: ${cycleError.message}`)
        }
        router.push(`/trainer/clients/${clientId}`)
        return
      }

      if (!cycleData) {
        console.error('No cycle data returned')
        alert('Training cycle not found.')
        router.push(`/trainer/clients/${clientId}`)
        return
      }

      console.log('Successfully fetched cycle:', cycleData)
      setCycle(cycleData)

      // Fetch training days for this week
      console.log('Fetching training days for week:', weekId)
      const { data: daysData, error: daysError } = await supabase
        .from('training_days')
        .select(`
          *,
          exercises (*)
        `)
        .eq('cycle_id', cycleId)
        .eq('week_number', weekId)
        .order('day_number', { ascending: true })

      if (daysError) {
        console.error('Error fetching training days:', daysError)
        console.error('Days error details:', {
          message: daysError.message,
          details: daysError.details,
          hint: daysError.hint,
          code: daysError.code
        })
        
        if (daysError.code === '42P01') {
          console.error('training_days table does not exist')
          alert('Database setup incomplete. Please contact support to set up the training system.')
        } else {
          console.error('Other database error loading training days')
        }
        
        // Still set empty array so the component can render
        setTrainingDays([])
      } else {
        console.log('Successfully fetched training days:', daysData)
        setTrainingDays(daysData || [])
      }

    } catch (error) {
      console.error('Unexpected error fetching data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Error loading data: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDay = async () => {
    if (!newDay.day_name.trim()) {
      alert('Please enter a day name')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No authenticated user found')
        alert('You must be logged in to create a training day')
        return
      }

      const dayNumber = trainingDays.length + 1

      console.log('Creating training day with data:', {
        cycle_id: cycleId,
        week_number: weekId,
        day_number: dayNumber,
        day_name: newDay.day_name,
        description: newDay.description,
        is_rest_day: newDay.is_rest_day,
        trainer_id: user.id
      })

      const { data, error } = await supabase
        .from('training_days')
        .insert([
          {
            cycle_id: cycleId,
            week_number: weekId,
            day_number: dayNumber,
            day_name: newDay.day_name,
            description: newDay.description,
            is_rest_day: newDay.is_rest_day,
            trainer_id: user.id
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Database error creating day:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        if (error.code === '42P01') {
          alert('Database table not found. Please contact support to set up the training system.')
        } else if (error.code === '23505') {
          alert('A day with this number already exists in this week. Please try again.')
        } else {
          alert(`Failed to create day: ${error.message}. Please try again.`)
        }
        return
      }

      console.log('Successfully created training day:', data)
      setTrainingDays(prev => [...prev, { ...data, exercises: [] }])
      setShowAddDay(false)
      setNewDay({ day_name: '', description: '', is_rest_day: false })

    } catch (error) {
      console.error('Unexpected error creating day:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to create day: ${errorMessage}. Please try again.`)
    }
  }

  const handleDeleteDay = async (dayId: string) => {
    if (!confirm('Are you sure you want to delete this training day?')) return

    try {
      const { error } = await supabase
        .from('training_days')
        .delete()
        .eq('id', dayId)

      if (error) {
        console.error('Error deleting day:', error)
        alert('Failed to delete day. Please try again.')
        return
      }

      setTrainingDays(prev => prev.filter(day => day.id !== dayId))

    } catch (error) {
      console.error('Error deleting day:', error)
      alert('Failed to delete day. Please try again.')
    }
  }

  const handleDayClick = (day: TrainingDay) => {
    // Navigate to day details page where trainer can manage exercises
    router.push(`/trainer/clients/${clientId}/training-cycles/${cycleId}/week/${weekId}/day/${day.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5d90] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading week details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="bg-[#2a5d90] text-white p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => router.push(`/trainer/clients/${clientId}/training-cycles/${cycleId}`)}
                  className="p-2 hover:bg-[#1e4a73] rounded-lg"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <p className="text-blue-200 text-sm">WEEK {weekId}</p>
                  <h1 className="text-2xl font-bold">
                    {cycle?.name} - Week {weekId}
                  </h1>
                  <p className="text-blue-200 text-sm mt-1">{cycle?.description}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddDay(true)}
                className="bg-[#1e4a73] hover:bg-[#16405e] px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Day</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {trainingDays.length === 0 ? (
            /* No Days State */
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No training days yet</h3>
                <p className="text-gray-600 mb-6">Add training days to this week to create a workout schedule.</p>
                <button 
                  onClick={() => setShowAddDay(true)}
                  className="bg-[#2a5d90] hover:bg-[#1e4a73] text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add First Day</span>
                </button>
              </div>
            </div>
          ) : (
            /* Training Days List */
            <div className="space-y-4">
              {trainingDays.map((day) => (
                <div key={day.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-500">Day {day.day_number}</span>
                          <h3 className="text-lg font-medium text-gray-900">{day.day_name}</h3>
                          {day.is_rest_day && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                              Rest Day
                            </span>
                          )}
                          {day.status === 'completed' && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium flex items-center space-x-1">
                              <span>✓</span>
                              <span>Completed</span>
                            </span>
                          )}
                        </div>
                        
                        {day.description && (
                          <p className="text-gray-600 mt-2">{day.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{day.exercises?.length || 0} exercises</span>
                          </div>
                          {day.status === 'completed' && day.completed_at && (
                            <div className="flex items-center space-x-1">
                              <span>Completed {new Date(day.completed_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDayClick(day)
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Edit3 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteDay(day.id)
                          }}
                          className="p-2 text-gray-400 hover:text-[#2a5d90] transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Day Modal */}
        {showAddDay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Training Day</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day Name *
                  </label>
                  <input
                    type="text"
                    value={newDay.day_name}
                    onChange={(e) => setNewDay(prev => ({ ...prev, day_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                    placeholder="e.g., Push Day, Leg Day, Cardio"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newDay.description}
                    onChange={(e) => setNewDay(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                    rows={3}
                    placeholder="Optional description for this training day"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rest-day"
                    checked={newDay.is_rest_day}
                    onChange={(e) => setNewDay(prev => ({ ...prev, is_rest_day: e.target.checked }))}
                    className="w-4 h-4 text-[#2a5d90] border-gray-300 rounded focus:ring-[#2a5d90]"
                  />
                  <label htmlFor="rest-day" className="text-sm text-gray-700">
                    This is a rest day
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowAddDay(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDay}
                  className="flex-1 px-4 py-2 bg-[#2a5d90] text-white rounded-lg hover:bg-[#1e4a73]"
                >
                  Add Day
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
