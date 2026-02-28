'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Calendar, CheckCircle, Clock, User, Settings, LogOut, ChevronDown, Dumbbell, Edit, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TrainingDay {
  id: string
  day_number: number
  day_name: string
  description: string
  status: string
  is_rest_day: boolean
  exercises: Array<{
    id: string
    name: string
    sets: number
    reps: string
    weight: string
    rest_time: string
    notes: string
    exercise_order: number
  }>
  created_at: string
}

interface Week {
  id: string
  name: string
  week_number: number
  status: string
  is_completed: boolean
  is_current_week?: boolean
  total_days: number
  completed_days: number
  days: TrainingDay[]
}

export default function WeekDetail() {
  const router = useRouter()
  const params = useParams()
  const cycleId = params.cycleId as string
  const weekId = params.weekId as string
  
  const [week, setWeek] = useState<Week | null>(null)
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

      console.log('📞 Fetching week data for cycle:', cycleId, 'week:', weekId)

      // Fetch week details and training days
      const response = await fetch(`/api/client/training-weeks/${cycleId}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        throw new Error(`Failed to fetch week data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ Week API Response data:', data)

      const { weeks } = data
      
      // Find the specific week
      const weekNumber = parseInt(weekId.replace('week-', ''))
      const currentWeek = weeks.find((w: Week) => w.week_number === weekNumber)
      
      if (!currentWeek) {
        console.error('❌ Week not found:', weekId)
        router.push(`/client/training/cycle/${cycleId}`)
        return
      }

      setWeek(currentWeek)
      setTrainingDays(currentWeek.days || [])

    } catch (error) {
      console.error('Error fetching week data:', error)
      router.push(`/client/training/cycle/${cycleId}`)
    } finally {
      setLoading(false)
    }
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700">Loading week details...</p>
        </div>
      </div>
    )
  }

  if (!week) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-blue-200 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">Week not found</h3>
          <button 
            onClick={() => router.push(`/client/training/cycle/${cycleId}`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Training Cycle
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-b-3xl shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={() => router.push(`/client/training/cycle/${cycleId}`)} className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <p className="text-blue-200 text-sm tracking-widest uppercase">Training Week</p>
                  <h1 className="text-3xl font-bold">
                    {week.name}
                  </h1>
                  <p className="text-blue-100 text-sm mt-1">
                    {week.total_days} days • {week.completed_days} completed
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-blue-200">
                    <Dumbbell className="h-4 w-4" />
                    <span className="text-sm">Training Week</span>
                  </div>
                  {week.is_completed && (
                    <div className="flex items-center space-x-2 text-green-200 mt-1">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Completed</span>
                    </div>
                  )}
                </div>
                {/* User Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center space-x-2 p-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <ChevronDown className="h-4 w-4 text-blue-200" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2 text-sm text-gray-600 border-b">
                      {currentUser?.email}
                    </div>
                    <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-8 space-y-8">
          {/* Week Progress */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Week Progress</h3>
              <div className="text-sm text-blue-600">
                {week.completed_days}/{week.total_days} days completed
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-blue-100 rounded-full h-3 mb-4">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${(week.completed_days / week.total_days) * 100}%`
                }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round((week.completed_days / week.total_days) * 100)}%</span>
            </div>
          </div>

          {/* Training Days */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-semibold text-gray-800">Training Days</h3>
              <div className="text-sm text-blue-600">
                {trainingDays.length} days assigned
              </div>
            </div>

            {trainingDays.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-blue-200 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-800 mb-3">No training days assigned yet</h3>
                <p className="text-gray-600">Your trainer hasn't created any training days for this week yet.</p>
                <p className="text-sm text-gray-500 mt-2">Check back later or contact your trainer!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trainingDays.map((day) => (
                  <button
                    key={day.id}
                    onClick={() => router.push(`/client/training/cycle/${cycleId}/week/${weekId}/day/${day.id}`)}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 text-left w-full bg-white hover:bg-blue-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{day.day_name}</h4>
                          <p className="text-sm text-gray-500">Day {day.day_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {day.status === 'completed' && (
                          <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            <CheckCircle className="h-4 w-4" />
                            <span>Completed</span>
                          </div>
                        )}
                        {day.is_rest_day && (
                          <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                            <Clock className="h-4 w-4" />
                            <span>Rest Day</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {day.description && (
                      <p className="text-gray-600 mb-4">{day.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Dumbbell className="h-4 w-4" />
                        <span>{day.exercises.length} exercises</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {day.status === 'completed' && (
                          <span className="text-xs text-gray-500">
                            Completed {new Date(day.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Exercise Preview */}
                    {day.exercises.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Exercises:</h5>
                        <div className="space-y-2">
                          {day.exercises.slice(0, 3).map((exercise, index) => (
                            <div key={exercise.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{exercise.name}</span>
                              <span className="text-gray-500">
                                {exercise.sets} sets × {exercise.reps}
                              </span>
                            </div>
                          ))}
                          {day.exercises.length > 3 && (
                            <p className="text-xs text-gray-500">
                              +{day.exercises.length - 3} more exercises
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 