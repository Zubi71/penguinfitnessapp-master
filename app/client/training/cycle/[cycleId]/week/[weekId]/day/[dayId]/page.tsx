'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Calendar, CheckCircle, Clock, User, Settings, LogOut, ChevronDown, Dumbbell, Info, Timer, Play, Pause, RotateCcw, ChevronDown as ChevronDownIcon, HelpCircle } from 'lucide-react'
import YouTubeModal from '@/components/ui/youtube-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  weight: string
  rest_time: string
  notes: string
  exercise_order: number
  muscle_group?: string
  youtube_video_url?: string
  set_progress: Array<{
    set_number: number
    weight: string
    reps: string
    notes?: string
    completed_at?: string
  }>
}

interface TrainingDay {
  id: string
  day_number: number
  day_name: string
  description: string
  status: string
  is_rest_day: boolean
  exercises: Exercise[]
  created_at: string
}

interface SetData {
  weight: string
  reps: string
}

export default function DayDetail() {
  const router = useRouter()
  const params = useParams()
  const cycleId = params.cycleId as string
  const weekId = params.weekId as string
  const dayId = params.dayId as string
  
  const [day, setDay] = useState<TrainingDay | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [timer, setTimer] = useState<number>(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set())
  const [exerciseData, setExerciseData] = useState<Record<string, SetData[]>>({})
  const [showYouTubeModal, setShowYouTubeModal] = useState(false)
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>('')
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    fetchDayData()
  }, [cycleId, weekId, dayId])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const fetchDayData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setCurrentUser(user)

      console.log('📞 Fetching day data for cycle:', cycleId, 'week:', weekId, 'day:', dayId)

      // Fetch week data to get the specific day
      const response = await fetch(`/api/client/training-weeks/${cycleId}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        throw new Error(`Failed to fetch day data: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ Day API Response data:', data)

      const { weeks } = data
      
      // Find the specific week
      const weekNumber = parseInt(weekId.replace('week-', ''))
      const currentWeek = weeks.find((w: any) => w.week_number === weekNumber)
      
      if (!currentWeek) {
        console.error('❌ Week not found:', weekId)
        router.push(`/client/training/cycle/${cycleId}`)
        return
      }

      // Find the specific day
      const currentDay = currentWeek.days.find((d: TrainingDay) => d.id === dayId)
      
      if (!currentDay) {
        console.error('❌ Day not found:', dayId)
        router.push(`/client/training/cycle/${cycleId}/week/${weekId}`)
        return
      }

      setDay(currentDay)

      // Debug: Check for YouTube videos in exercises
      console.log('🔍 Checking exercises for YouTube videos...')
      currentDay.exercises.forEach((exercise: Exercise) => {
        if (exercise.youtube_video_url) {
          console.log('🎥 Found YouTube video for exercise:', exercise.name, 'URL:', exercise.youtube_video_url)
        }
      })

      // Initialize exercise data with trainer's set-specific values
      const initialData: Record<string, SetData[]> = {}
      currentDay.exercises.forEach((exercise: Exercise) => {
        // Create array of sets with trainer's assigned values for each set
        const setsData: SetData[] = Array(exercise.sets).fill(null).map((_, setIndex) => {
          const setNumber = setIndex + 1
          const setProgress = exercise.set_progress.find(set => set.set_number === setNumber)
          
          return {
            weight: setProgress?.weight || exercise.weight || '',
            reps: setProgress?.reps || exercise.reps || ''
          }
        })
        initialData[exercise.id] = setsData
      })
      setExerciseData(initialData)
      
      // Load existing progress for each exercise
      currentDay.exercises.forEach((exercise: Exercise) => {
        loadExistingProgress(exercise.id)
      })

    } catch (error) {
      console.error('Error fetching day data:', error)
      router.push(`/client/training/cycle/${cycleId}/week/${weekId}`)
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const resetTimer = () => {
    setTimer(0)
    setIsTimerRunning(false)
  }

  const handleOpenYouTubeModal = (videoUrl: string, exerciseName: string) => {
    console.log('🎥 Opening YouTube modal:', { videoUrl, exerciseName })
    if (videoUrl) {
      setSelectedVideoUrl(videoUrl)
      setSelectedExerciseName(exerciseName)
      setShowYouTubeModal(true)
    } else {
      console.log('❌ No video URL provided for exercise:', exerciseName)
    }
  }

  const toggleExercise = (exerciseId: string) => {
    setExpandedExercises(prev => {
      const newSet = new Set(prev)
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId)
      } else {
        newSet.add(exerciseId)
      }
      return newSet
    })
  }

  const updateSetData = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setExerciseData(prev => {
      const newData = { ...prev }
      if (!newData[exerciseId]) {
        newData[exerciseId] = []
      }
      if (!newData[exerciseId][setIndex]) {
        newData[exerciseId][setIndex] = { weight: '', reps: '' }
      }
      newData[exerciseId][setIndex] = {
        ...newData[exerciseId][setIndex],
        [field]: value
      }
      return newData
    })
  }

  const saveProgress = async (exerciseId: string) => {
    try {
      const currentExerciseData = exerciseData[exerciseId]
      if (!currentExerciseData) return

      // Get the client ID from the training program
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get client ID for current user by email using API endpoint
      try {
        const clientResponse = await fetch(`/api/client-by-email?email=${encodeURIComponent(user.email || '')}`)
        const clientResult = await clientResponse.json()
        
        if (!clientResult.success || !clientResult.client) {
          console.error('Error fetching client data:', clientResult.error)
          console.log('User email:', user.email)
          return
        }
        
                const clientData = clientResult.client
        console.log('✅ Client data fetched via API:', clientData)
        
        // Prepare set progress data
        const setProgress: Record<string, { weight: string; reps: string }> = {}
        currentExerciseData.forEach((set: SetData, index: number) => {
          if (set.weight || set.reps) {
            setProgress[index] = {
              weight: set.weight,
              reps: set.reps
            }
          }
        })

        // Save to set_progress table
        const response = await fetch('/api/set-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            exerciseId,
            trainingDayId: dayId,
            clientId: clientData.id,
            setProgress
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error saving progress:', errorData)
          alert('Failed to save progress. Please try again.')
          return
        }

        console.log('Progress saved successfully')
        alert('Progress saved successfully!')
      } catch (apiError) {
        console.error('Error calling client API:', apiError)
        alert('Failed to get client data. Please try again.')
      }
    } catch (error) {
      console.error('Error saving progress:', error)
      alert('Failed to save progress. Please try again.')
    }
  }

  const loadExistingProgress = async (exerciseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get client ID for current user by email using API endpoint
      try {
        const clientResponse = await fetch(`/api/client-by-email?email=${encodeURIComponent(user.email || '')}`)
        const clientResult = await clientResponse.json()
        
        if (!clientResult.success || !clientResult.client) {
          console.error('Error fetching client data:', clientResult.error)
          return
        }
        
        const clientData = clientResult.client

        // Load existing progress from set_progress table
        const response = await fetch(`/api/set-progress?exerciseId=${exerciseId}&trainingDayId=${dayId}&clientId=${clientData.id}`)
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.progress) {
            // Update the exercise data with existing progress
            const existingProgress = data.progress
            const currentData = exerciseData[exerciseId] || []
            
            const updatedData = currentData.map((set: SetData, index: number) => {
              const existingSet = existingProgress[index]
              return {
                weight: existingSet?.weight || set.weight,
                reps: existingSet?.reps || set.reps
              }
            })
            
            setExerciseData(prev => ({
              ...prev,
              [exerciseId]: updatedData
            }))
          }
        }
      } catch (apiError) {
        console.error('Error calling client API:', apiError)
      }
    } catch (error) {
      console.error('Error loading existing progress:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700">Loading day details...</p>
        </div>
      </div>
    )
  }

  if (!day) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-blue-200 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">Day not found</h3>
          <button 
            onClick={() => router.push(`/client/training/cycle/${cycleId}/week/${weekId}`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Week
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => router.push(`/client/training/cycle/${cycleId}/week/${weekId}`)} 
                  className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-blue-200">
                      <Dumbbell className="h-4 w-4" />
                      <span className="text-sm">Training Day</span>
                    </div>
                  </div>
                  {/* Timer Button */}
                  <button
                    onClick={toggleTimer}
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center space-x-2"
                  >
                    <Timer className="h-4 w-4" />
                    <span>Open Timer</span>
                  </button>
                </div>
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

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Breadcrumbs */}
          <div className="text-sm text-gray-600">
            CYCLE &gt; WEEK &gt; DAY
          </div>

          {/* Day Title */}
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">{day.day_name}</h1>
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <Info className="h-4 w-4 text-white" />
            </div>
          </div>

          {/* Timer Display (if active) */}
          {isTimerRunning && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {formatTime(timer)}
                  </div>
                  <div className="text-sm text-gray-600">Workout Timer</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={toggleTimer}
                    className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isTimerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Exercises */}
          <div className="space-y-4">
            {day.exercises.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <Dumbbell className="h-16 w-16 text-blue-200 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-800 mb-3">No exercises assigned yet</h3>
                <p className="text-gray-600">Your trainer hasn't created any exercises for this day yet.</p>
                <p className="text-sm text-gray-500 mt-2">Check back later or contact your trainer!</p>
              </div>
            ) : (
              day.exercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
                >
                  {/* Exercise Header */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 px-3 py-1 rounded-full text-sm font-medium text-blue-800">
                          {exercise.sets} SETS
                        </div>
                        <div className="text-gray-500">
                          <HelpCircle className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {exercise.muscle_group && (
                          <div className="bg-blue-100 px-2 py-1 rounded text-xs font-medium text-blue-800">
                            {exercise.muscle_group.toUpperCase()}
                          </div>
                        )}
                                                 <button 
                           onClick={() => {
                             console.log('🔍 Info button clicked for exercise:', exercise.name, 'Video URL:', exercise.youtube_video_url)
                             console.log('🔍 Full exercise object:', exercise)
                             handleOpenYouTubeModal(exercise.youtube_video_url || '', exercise.name)
                           }}
                          className={`px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 ${
                            exercise.youtube_video_url 
                              ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                          disabled={!exercise.youtube_video_url}
                        >
                          <Info className="h-3 w-3" />
                          <span>INFO</span>
                        </button>
                      </div>
                    </div>

                    {/* Exercise Name and Details */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{exercise.name}</h3>
                      <button
                        onClick={() => toggleExercise(exercise.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <ChevronDownIcon 
                          className={`h-5 w-5 text-gray-400 transition-transform ${
                            expandedExercises.has(exercise.id) ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Exercise Details */}
                    <div className="flex items-center justify-between">
                      <div className="text-gray-600">
                        Reps: {exercise.reps}
                      </div>
                      <div className="flex items-center space-x-2">
                        {exercise.weight && (
                          <div className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Weight: {exercise.weight}
                          </div>
                        )}
                        <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors">
                          <Clock className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-600">Rest: {exercise.rest_time}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Set Input Section */}
                  {expandedExercises.has(exercise.id) && (
                    <div className="border-t border-gray-100 p-6 bg-gray-50">
                      {/* Trainer Assignment Note */}
                      {(exercise.weight || exercise.reps || exercise.set_progress.length > 0) && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Trainer Assignment:</strong> Your trainer has assigned specific weights and reps for each set. You can modify these values based on your performance.
                          </p>
                        </div>
                      )}
                      
                      {/* Set Input Table */}
                      <div className="mb-6">
                        <div className="grid grid-cols-3 gap-4 mb-4 text-sm font-medium text-gray-700">
                          <div>Set</div>
                          <div>Weight</div>
                          <div>Reps</div>
                        </div>
                        <div className="space-y-3">
                          {Array.from({ length: exercise.sets }, (_, setIndex) => (
                            <div key={setIndex} className="grid grid-cols-3 gap-4 items-center">
                              <div className="text-sm text-gray-600 font-medium">
                                {setIndex + 1}
                              </div>
                              <input
                                type="text"
                                placeholder={exercise.weight ? `Trainer: ${exercise.weight}` : "e.g., 60kg"}
                                value={exerciseData[exercise.id]?.[setIndex]?.weight || ''}
                                onChange={(e) => updateSetData(exercise.id, setIndex, 'weight', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              <input
                                type="text"
                                placeholder={exercise.reps ? `Trainer: ${exercise.reps}` : "e.g., 12"}
                                value={exerciseData[exercise.id]?.[setIndex]?.reps || ''}
                                onChange={(e) => updateSetData(exercise.id, setIndex, 'reps', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Save Progress Button */}
                      <button
                        onClick={() => saveProgress(exercise.id)}
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Save Progress
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Session Notes */}
          {/* <div className="bg-gray-100 rounded-xl p-4">
            <button className="w-full text-left text-gray-600 font-medium">
              SESSION NOTES
            </button>
          </div> */}
        </div>
      </div>

      {/* YouTube Video Modal */}
      <YouTubeModal
        isOpen={showYouTubeModal}
        onClose={() => setShowYouTubeModal(false)}
        videoUrl={selectedVideoUrl}
        exerciseName={selectedExerciseName}
      />
    </div>
  )
} 