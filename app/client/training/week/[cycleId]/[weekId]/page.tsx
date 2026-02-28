'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Calendar, Clock, CheckCircle } from 'lucide-react'
import UserDropdown from '@/components/UserDropdown'

interface TrainingDay {
  id: string
  day_number: number
  day_name: string
  description: string
  is_rest_day: boolean
  exercises: Exercise[]
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
  trainer: {
    name: string
    email: string
  }
}

export default function ClientWeekView() {
  const router = useRouter()
  const params = useParams()
  const cycleId = params.cycleId as string
  const weekId = parseInt(params.weekId as string)
  
  const [cycle, setCycle] = useState<TrainingCycle | null>(null)
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchWeekData()
  }, [cycleId, weekId])

  const fetchWeekData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setCurrentUser(user)

      // Use the existing API to get client data and training programs
      const response = await fetch('/api/client/training-programs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch training programs: ${response.status}`)
      }

      const data = await response.json()
      const { trainingPrograms } = data

      // Find the specific cycle by cycleId
      const cycleData = trainingPrograms.find((program: any) => program.id === cycleId)
      
      if (!cycleData) {
        console.error('Cycle not found:', cycleId)
        router.push('/client/training')
        return
      }

      setCycle({
        id: cycleData.id,
        name: cycleData.name,
        description: cycleData.description,
        trainer: {
          name: cycleData.trainer_name || 'Your Trainer',
          email: cycleData.trainer_email || ''
        }
      })

      // Fetch training days for this week
      const { data: daysData, error: daysError } = await supabase
        .from('training_days')
        .select(`
          *,
          exercises (
            id,
            name,
            sets,
            reps,
            weight,
            rest_time,
            notes,
            exercise_order
          )
        `)
        .eq('cycle_id', cycleId)
        .eq('week_number', weekId)
        .order('day_number', { ascending: true })

      if (daysError) {
        console.error('Error fetching training days:', daysError)
        // Try a simpler query without exercises if the join fails
        const { data: simpleDaysData, error: simpleDaysError } = await supabase
          .from('training_days')
          .select('*')
          .eq('cycle_id', cycleId)
          .eq('week_number', weekId)
          .order('day_number', { ascending: true })

        if (simpleDaysError) {
          console.error('Error fetching simple training days:', simpleDaysError)
          setTrainingDays([])
        } else {
          // For each day, fetch exercises separately
          const daysWithExercises = await Promise.all(
            (simpleDaysData || []).map(async (day) => {
              const { data: exerciseData } = await supabase
                .from('exercises')
                .select('*')
                .eq('training_day_id', day.id)
                .order('exercise_order', { ascending: true })
              
              return {
                ...day,
                exercises: exerciseData || []
              }
            })
          )
          setTrainingDays(daysWithExercises)
        }
      } else {
        setTrainingDays(daysData || [])
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDayClick = (day: TrainingDay) => {
    router.push(`/client/training/day/${cycleId}/${weekId}/${day.id}`)
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSettings = () => {
    router.push('/account')
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
                  onClick={() => router.push('/client/training')}
                  className="p-2 hover:bg-[#1e4a73] rounded-lg"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <p className="text-blue-200 text-sm">WEEK {weekId}</p>
                  <h1 className="text-2xl font-bold">
                    {cycle?.name} - Week {weekId}
                  </h1>
                  <p className="text-blue-200 text-sm mt-1">by {cycle?.trainer.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 text-blue-200">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{trainingDays.length} days planned</span>
                </div>
              </div>
              
              {/* User Dropdown Menu */}
              <UserDropdown userEmail={currentUser?.email} variant="dark" />
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
                <p className="text-gray-600 mb-6">Your trainer hasn't set up this week yet.</p>
                <p className="text-sm text-gray-500">Check back later or contact your trainer.</p>
              </div>
            </div>
          ) : (
            /* Training Days List */
            <div className="space-y-4">
              {trainingDays.map((day) => (
                <div 
                  key={day.id} 
                  className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleDayClick(day)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">Day {day.day_number}</span>
                          <h3 className="text-lg font-medium text-gray-900">{day.day_name}</h3>
                          {day.is_rest_day && (
                            <span className="px-2 py-1 bg-[#2a5d90]/10 text-[#2a5d90] text-xs rounded-full font-medium">
                              Rest Day
                            </span>
                          )}
                        </div>
                        
                        {day.description && (
                          <p className="text-gray-600 mb-3">{day.description}</p>
                        )}
                        
                        {day.is_rest_day ? (
                          <div className="flex items-center space-x-2 text-[#2a5d90]">
                            <span className="text-2xl">😴</span>
                            <span className="text-sm">Take a break and recover</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{day.exercises?.length || 0} exercises</span>
                              </div>
                            </div>
                            
                            {day.exercises && day.exercises.length > 0 && (
                              <div className="mt-3">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Exercises Preview:</h4>
                                <div className="space-y-1">
                                  {day.exercises.slice(0, 3).map((exercise, index) => (
                                    <div key={exercise.id} className="text-sm text-gray-600">
                                      {index + 1}. {exercise.name}
                                      {exercise.sets && exercise.reps && (
                                        <span className="text-gray-500 ml-2">
                                          ({exercise.sets} × {exercise.reps})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  {day.exercises.length > 3 && (
                                    <div className="text-sm text-gray-500">
                                      +{day.exercises.length - 3} more exercises
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">{day.day_number}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar for exercises */}
                  {!day.is_rest_day && day.exercises && day.exercises.length > 0 && (
                    <div className="px-6 pb-4">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div className="bg-[#2a5d90] h-1 rounded-full w-0 transition-all duration-300"></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Ready to start</span>
                        <span>{day.exercises.length} exercises</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Week Summary */}
          {trainingDays.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Week Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-[#2a5d90]">
                    {trainingDays.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Days</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#2a5d90]">
                    {trainingDays.filter(d => d.is_rest_day).length}
                  </div>
                  <div className="text-sm text-gray-600">Rest Days</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#2a5d90]">
                    {trainingDays.filter(d => !d.is_rest_day).length}
                  </div>
                  <div className="text-sm text-gray-600">Training Days</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#2a5d90]">
                    {trainingDays.reduce((total, day) => total + (day.exercises?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Exercises</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
