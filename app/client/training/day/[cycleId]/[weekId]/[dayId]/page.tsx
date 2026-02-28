'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, GripVertical, Edit3, Trash2 } from 'lucide-react'
import YouTubeModal from '@/components/ui/youtube-modal'

interface Exercise {
  id: string
  exercise_order: number
  name: string
  sets: number
  reps: string
  weight: string
  rest_time: string
  notes: string
  exercise_type?: string
  difficulty?: string
  youtube_video_url?: string
}

interface TrainingDay {
  id: string
  day_name: string
  description: string
  is_rest_day: boolean
  week_number: number
  day_number: number
  status: 'pending' | 'completed'
  completed_at: string | null
}

interface TrainingCycle {
  id: string
  name: string
  description: string
}

export default function ClientTrainingDay() {
  const router = useRouter()
  const params = useParams()
  const cycleId = params.cycleId as string
  const weekId = parseInt(params.weekId as string)
  const dayId = params.dayId as string
  
  const [cycle, setCycle] = useState<TrainingCycle | null>(null)
  const [trainingDay, setTrainingDay] = useState<TrainingDay | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
  const [setProgress, setSetProgress] = useState<{[key: string]: {weight: string, reps: string}[]}>({})
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [showYouTubeModal, setShowYouTubeModal] = useState(false)
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>('')
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    fetchUserAndDayData()
  }, [dayId])

  const fetchUserAndDayData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setCurrentUser(user)

      // Get client ID for current user by email using API endpoint
      try {
        const clientResponse = await fetch(`/api/client-by-email?email=${encodeURIComponent(user.email || '')}`)
        const clientResult = await clientResponse.json()
        
        if (!clientResult.success || !clientResult.client) {
          console.error('Error fetching client data:', clientResult.error)
          console.log('User email:', user.email)
          router.push('/client')
          return
        }
        
        const clientData = clientResult.client
        console.log('✅ Client data fetched via API:', clientData)
        
        setClientId(clientData.id)
        console.log('✅ Client ID set:', clientData.id)
        
        // Debug client access
        try {
          const debugResponse = await fetch(`/api/debug-client?clientId=${clientData.id}`)
          const debugData = await debugResponse.json()
          console.log('🔍 Debug client access:', debugData)
        } catch (debugError) {
          console.log('❌ Debug error:', debugError)
        }
        
      } catch (apiError) {
        console.error('Error calling client API:', apiError)
        router.push('/client')
        return
      }

      // Fetch training day details
      const { data: dayData, error: dayError } = await supabase
        .from('training_days')
        .select(`
          *,
          training_programs!cycle_id (
            id,
            name,
            description
          )
        `)
        .eq('id', dayId)
        .single()

      if (dayError || !dayData) {
        console.error('Error fetching day:', dayError)
        router.push(`/client/training`)
        return
      }

      setTrainingDay(dayData)
      setCycle(dayData.training_programs)

      // Debug exercises access first
      try {
        const debugResponse = await fetch(`/api/debug-exercises?dayId=${dayId}`)
        const debugData = await debugResponse.json()
        console.log('🔍 Debug exercises access:', debugData)
      } catch (debugError) {
        console.log('❌ Debug exercises error:', debugError)
      }

      // Fetch exercises for this day
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('training_day_id', dayId)
        .order('exercise_order')

      console.log('🔍 Exercises data:', exercisesData)

      if (exercisesError) {
        console.error('Error fetching exercises:', exercisesError)
      } else {
        console.log('✅ Exercises fetched:', exercisesData)
        // Check for YouTube videos in exercises
        exercisesData?.forEach(exercise => {
          if (exercise.youtube_video_url) {
            console.log('🎥 Found YouTube video for exercise:', exercise.name, 'URL:', exercise.youtube_video_url)
          }
        })
        setExercises(exercisesData || [])
      }

    } catch (error) {
      console.error('Error in fetchUserAndDayData:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleExerciseExpansion = async (exerciseId: string) => {
    const newExpandedState = expandedExercise === exerciseId ? null : exerciseId
    setExpandedExercise(newExpandedState)
    
    // Load existing progress if expanding
    if (newExpandedState) {
      await loadExerciseProgress(exerciseId)
    }
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

  const loadExerciseProgress = async (exerciseId: string) => {
    try {
      const exercise = exercises.find(ex => ex.id === exerciseId)
      if (!exercise || !clientId) return

      const response = await fetch(`/api/set-progress?exerciseId=${exerciseId}&trainingDayId=${dayId}&clientId=${clientId}`)
      const data = await response.json()

      if (data.success && data.progress) {
        // Ensure we have the correct array structure for all sets
        const progressArray = Array.from({ length: exercise.sets }, (_, index) => {
          const setData = data.progress[index] || { weight: '', reps: '' }
          return {
            weight: setData.weight || '',
            reps: setData.reps || ''
          }
        })
        
        setSetProgress(prev => ({
          ...prev,
          [exerciseId]: progressArray
        }))
      } else {
        // Initialize empty progress if no existing data
        const initialSets = Array.from({ length: exercise.sets }, () => ({ weight: '', reps: '' }))
        setSetProgress(prev => ({
          ...prev,
          [exerciseId]: initialSets
        }))
      }
    } catch (error) {
      console.error('Error loading exercise progress:', error)
      // Initialize empty progress on error
      const exercise = exercises.find(ex => ex.id === exerciseId)
      if (exercise) {
        const initialSets = Array.from({ length: exercise.sets }, () => ({ weight: '', reps: '' }))
        setSetProgress(prev => ({
          ...prev,
          [exerciseId]: initialSets
        }))
      }
    }
  }

  const handleSetProgressChange = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setSetProgress(prev => {
      // Ensure we have a proper array for this exercise
      const currentSets = Array.isArray(prev[exerciseId]) ? prev[exerciseId] : []
      
      // Create new array with updated value
      const updatedSets = [...currentSets]
      if (!updatedSets[setIndex]) {
        updatedSets[setIndex] = { weight: '', reps: '' }
      }
      updatedSets[setIndex] = { ...updatedSets[setIndex], [field]: value }
      
      return {
        ...prev,
        [exerciseId]: updatedSets
      }
    })
  }

  const handleSaveProgress = async (exerciseId: string) => {
    try {
      const progress = setProgress[exerciseId]
      if (!progress || !clientId) return

      const response = await fetch('/api/set-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId,
          trainingDayId: dayId,
          clientId,
          setProgress: progress
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert('Progress saved successfully!')
        // Optionally close the expanded view
        setExpandedExercise(null)
      } else {
        alert(data.error || 'Failed to save progress')
      }
      
    } catch (error) {
      console.error('Error saving progress:', error)
      alert('Failed to save progress. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5d90] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workout...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="bg-[#2a5d90] text-white p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
              <div className="flex items-center space-x-3 sm:space-x-4 w-full">
                <button 
                  onClick={() => router.push(`/client/training`)}
                  className="p-2 hover:bg-[#1e4a73] rounded-lg"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-blue-200 text-xs sm:text-sm truncate">WEEK {weekId} • DAY {trainingDay?.day_number}</p>
                  <h1 className="text-xl sm:text-2xl font-bold truncate">
                    {trainingDay?.day_name}
                  </h1>
                  <p className="text-blue-200 text-xs sm:text-sm mt-1 truncate">{cycle?.name}</p>
                  {trainingDay?.status === 'completed' && trainingDay?.completed_at && (
                    <p className="text-blue-200 text-xs mt-1">
                      ✓ Completed on {new Date(trainingDay.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {trainingDay?.is_rest_day ? (
            /* Rest Day State */
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">😴</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Rest Day</h3>
                <p className="text-gray-600 mb-4">
                  {trainingDay.description || 'Take a break and let your muscles recover.'}
                </p>
                <p className="text-sm text-gray-500">
                  Rest days are important for muscle recovery and growth.
                </p>
                
                {/* Status indicator for rest day */}
                <div className="mt-6">
                  {trainingDay.status === 'completed' ? (
                    <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                      <span className="text-lg">✓</span>
                      <span className="font-medium">Rest Day Completed</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center space-x-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full">
                      <span className="text-lg">○</span>
                      <span className="font-medium">Rest Day Pending</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : exercises.length === 0 ? (
            /* No Exercises State */
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💪</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No exercises yet</h3>
                <p className="text-gray-600 mb-6">Your trainer hasn't added exercises for this day yet.</p>
              </div>
            </div>
          ) : (
            /* Exercises List */
            <div className="space-y-4">
              {/* Day Status Summary */}
              <div className={`p-4 rounded-lg ${
                trainingDay?.status === 'completed' 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`text-2xl ${
                      trainingDay?.status === 'completed' ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {trainingDay?.status === 'completed' ? '✓' : '○'}
                    </span>
                    <div>
                      <h3 className={`font-medium ${
                        trainingDay?.status === 'completed' ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        {trainingDay?.status === 'completed' ? 'Workout Completed' : 'Workout In Progress'}
                      </h3>
                      <p className={`text-sm ${
                        trainingDay?.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} planned
                        {trainingDay?.status === 'completed' && trainingDay?.completed_at && 
                          ` • Completed ${new Date(trainingDay.completed_at).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {exercises.map((exercise, index) => (
                <div key={exercise.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 relative">
                  {/* Drag Handle */}
                  <div className="absolute top-4 left-4">
                    <GripVertical className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  {/* Sets Count - Centered at top */}
                  <div className="text-center mb-4">
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      {exercise.sets} SETS
                    </span>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    {/* Exercise Identifier */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-600">
                          {String.fromCharCode(65 + index)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Muscle Group Tag */}
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                          exercise.exercise_type === 'strength' ? 'bg-blue-500' :
                          exercise.exercise_type === 'cardio' ? 'bg-green-500' :
                          exercise.exercise_type === 'flexibility' ? 'bg-purple-500' :
                          exercise.exercise_type === 'balance' ? 'bg-orange-500' :
                          'bg-gray-500'
                        }`}>
                          {exercise.exercise_type?.toUpperCase() || 'STRENGTH'}
                        </span>
                                                 <button 
                           onClick={() => {
                             console.log('🔍 Info button clicked for exercise:', exercise.name, 'Video URL:', exercise.youtube_video_url)
                             console.log('🔍 Exercise object:', exercise)
                             handleOpenYouTubeModal(exercise.youtube_video_url || '', exercise.name)
                           }}
                           className={`flex items-center space-x-1 text-xs ${
                             exercise.youtube_video_url 
                               ? 'text-blue-600 hover:text-blue-800' 
                               : 'text-gray-500 hover:text-gray-700'
                           }`}
                           disabled={!exercise.youtube_video_url}
                         >
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            exercise.youtube_video_url ? 'bg-blue-500' : 'bg-gray-300'
                          }`}>
                            <span className="text-white text-xs font-bold">i</span>
                          </div>
                          <span>INFO</span>
                        </button>
                      </div>
                      
                      {/* Exercise Name */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900 break-words">
                          {exercise.name}
                        </h3>
                        <button 
                          onClick={() => handleToggleExerciseExpansion(exercise.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <svg 
                            className={`h-4 w-4 text-gray-400 transform transition-transform ${
                              expandedExercise === exercise.id ? 'rotate-180' : ''
                            }`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Reps Information */}
                      <p className="text-sm text-gray-600 mb-3">
                        Reps: {exercise.reps || 'N/A'}
                      </p>
                      
                      {/* Rest Time Button */}
                      <div className="flex justify-end">
                        <button className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Rest: {exercise.rest_time || 'N/A'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Set Input Form */}
                  {expandedExercise === exercise.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Track Your Sets</h4>
                        
                        {/* Set Input Table */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="grid grid-cols-3 gap-4 mb-3 text-xs font-medium text-gray-600 uppercase tracking-wide">
                            <div>Set</div>
                            <div>Weight</div>
                            <div>Reps</div>
                          </div>
                          
                          {Array.from({ length: exercise.sets }, (_, setIndex) => (
                            <div key={setIndex} className="grid grid-cols-3 gap-4 mb-3">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-700">{setIndex + 1}</span>
                              </div>
                              <div>
                                <input
                                  type="text"
                                  placeholder="e.g., 60kg"
                                  value={setProgress[exercise.id]?.[setIndex]?.weight || ''}
                                  onChange={(e) => handleSetProgressChange(exercise.id, setIndex, 'weight', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                                />
                              </div>
                              <div>
                                <input
                                  type="text"
                                  placeholder="e.g., 12"
                                  value={setProgress[exercise.id]?.[setIndex]?.reps || ''}
                                  onChange={(e) => handleSetProgressChange(exercise.id, setIndex, 'reps', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Save Progress Button */}
                        <button
                          onClick={() => handleSaveProgress(exercise.id)}
                          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                          Save Progress
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Floating Action Button - Bottom Right */}
              <button 
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#2a5d90] rounded-full flex items-center justify-center hover:bg-[#1e4a73] transition-colors shadow-lg z-40"
                onClick={() => {
                  // Add your action here
                  console.log('Floating action button clicked')
                }}
              >
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}

          {/* YouTube Video Modal */}
          <YouTubeModal
            isOpen={showYouTubeModal}
            onClose={() => setShowYouTubeModal(false)}
            videoUrl={selectedVideoUrl}
            exerciseName={selectedExerciseName}
          />
        </div>
      </div>
    </div>
  )
}
