'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Plus, Edit3, Trash2, GripVertical, Search } from 'lucide-react'
import ExerciseSearch from '@/components/exercises/ExerciseSearch'
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

export default function DayExercises() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.clientId as string
  const cycleId = params.cycleId as string
  const weekId = parseInt(params.weekId as string)
  const dayId = params.dayId as string
  
  const [cycle, setCycle] = useState<TrainingCycle | null>(null)
  const [trainingDay, setTrainingDay] = useState<TrainingDay | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [exerciseInputMode, setExerciseInputMode] = useState<'search' | 'custom'>('search')
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
  const [setProgress, setSetProgress] = useState<{[key: string]: {weight: string, reps: string}[]}>({})
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: 3,
    reps: '',
    weight: '',
    rest_time: '',
    notes: '',
    exercise_type: 'strength',
    difficulty: 'intermediate',
    youtube_video_url: ''
  })
  const [showNavigationModal, setShowNavigationModal] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState<string>('')
  const [selectedDay, setSelectedDay] = useState<string>('')
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([])
  const [availableDays, setAvailableDays] = useState<number[]>([])
  const [showSessionDetailsModal, setShowSessionDetailsModal] = useState(false)
  const [selectedSessionData, setSelectedSessionData] = useState<any>(null)
  const [sessionIntensity, setSessionIntensity] = useState<number>(5)
  const [sessionDuration, setSessionDuration] = useState<string>('')
  const [sessionNotes, setSessionNotes] = useState<string>('')
  const [clientData, setClientData] = useState<any>(null)
  const [showYouTubeModal, setShowYouTubeModal] = useState(false)
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>('')
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    fetchDayData()
    fetchClientData()
  }, [dayId])

  useEffect(() => {
    if (showNavigationModal) {
      fetchAvailableWeeksAndDays()
    }
  }, [showNavigationModal])

  const fetchDayData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
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
        .eq('trainer_id', user.id)
        .single()

      if (dayError || !dayData) {
        console.error('Error fetching day:', dayError)
        router.push(`/trainer/clients/${clientId}/training-cycles/${cycleId}/week/${weekId}`)
        return
      }

      setTrainingDay(dayData)
      setCycle(dayData.training_programs)

      // Fetch exercises for this day
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('training_day_id', dayId)
        .order('exercise_order', { ascending: true })

      if (exercisesError) {
        console.error('Error fetching exercises:', exercisesError)
      } else {
        setExercises(exercisesData || [])
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddExercise = async () => {
    if (!newExercise.name.trim()) {
      alert('Please enter an exercise name')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const exerciseOrder = exercises.length + 1

      const { data, error } = await supabase
        .from('exercises')
        .insert([
          {
            training_day_id: dayId,
            trainer_id: user.id,
            exercise_order: exerciseOrder,
            name: newExercise.name,
            sets: newExercise.sets,
            reps: newExercise.reps,
            weight: newExercise.weight,
            rest_time: newExercise.rest_time,
            notes: newExercise.notes,
            youtube_video_url: newExercise.youtube_video_url
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating exercise:', error)
        alert('Failed to create exercise. Please try again.')
        return
      }

      setExercises(prev => [...prev, data])
      setShowAddExercise(false)
      setNewExercise({
        name: '',
        sets: 3,
        reps: '',
        weight: '',
        rest_time: '',
        notes: '',
        exercise_type: 'strength',
        difficulty: 'intermediate',
        youtube_video_url: ''
      })

    } catch (error) {
      console.error('Error creating exercise:', error)
      alert('Failed to create exercise. Please try again.')
    }
  }

  const handleSelectExerciseFromLibrary = (exercise: any) => {
    setNewExercise({
      name: exercise.name,
      sets: exercise.default_sets || 3,
      reps: exercise.default_reps || '',
      weight: '',
      rest_time: exercise.default_rest_time || '60s',
      notes: '',
      exercise_type: 'strength',
      difficulty: 'intermediate',
      youtube_video_url: ''
    })
    setExerciseInputMode('custom')
  }

  const handleEditExercise = async () => {
    if (!editingExercise || !editingExercise.name.trim()) {
      alert('Please enter an exercise name')
      return
    }

    try {
      const { error } = await supabase
        .from('exercises')
        .update({
          name: editingExercise.name,
          sets: editingExercise.sets,
          reps: editingExercise.reps,
          weight: editingExercise.weight,
          rest_time: editingExercise.rest_time,
          notes: editingExercise.notes,
          youtube_video_url: editingExercise.youtube_video_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingExercise.id)

      if (error) {
        console.error('Error updating exercise:', error)
        alert('Failed to update exercise. Please try again.')
        return
      }

      setExercises(prev => prev.map(ex => 
        ex.id === editingExercise.id ? editingExercise : ex
      ))
      setEditingExercise(null)

    } catch (error) {
      console.error('Error updating exercise:', error)
      alert('Failed to update exercise. Please try again.')
    }
  }

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return

    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId)

      if (error) {
        console.error('Error deleting exercise:', error)
        alert('Failed to delete exercise. Please try again.')
        return
      }

      setExercises(prev => prev.filter(ex => ex.id !== exerciseId))

    } catch (error) {
      console.error('Error deleting exercise:', error)
      alert('Failed to delete exercise. Please try again.')
    }
  }

  const handleToggleStatus = async () => {
    if (!trainingDay) return
    
    setUpdatingStatus(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newStatus = trainingDay.status === 'completed' ? 'pending' : 'completed'
      const completedAt = newStatus === 'completed' ? new Date().toISOString() : null

      const { error } = await supabase
        .from('training_days')
        .update({
          status: newStatus,
          completed_at: completedAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', dayId)
        .eq('trainer_id', user.id)

      if (error) {
        console.error('Error updating day status:', error)
        alert('Failed to update status. Please try again.')
        return
      }

      setTrainingDay(prev => prev ? {
        ...prev,
        status: newStatus,
        completed_at: completedAt
      } : null)

    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status. Please try again.')
    } finally {
      setUpdatingStatus(false)
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
    if (videoUrl) {
      setSelectedVideoUrl(videoUrl)
      setSelectedExerciseName(exerciseName)
      setShowYouTubeModal(true)
    }
  }

  const loadExerciseProgress = async (exerciseId: string) => {
    try {
      const exercise = exercises.find(ex => ex.id === exerciseId)
      if (!exercise) return

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
      
      console.log(`🔧 Updated set ${setIndex + 1} ${field}:`, value)
      console.log(`🔧 Current progress for ${exerciseId}:`, updatedSets)
      
      return {
        ...prev,
        [exerciseId]: updatedSets
      }
    })
  }

  const handleSaveProgress = async (exerciseId: string) => {
    try {
      const progress = setProgress[exerciseId]
      if (!progress) return

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

  const fetchClientData = async () => {
    try {
      console.log('🔍 Fetching client data for clientId:', clientId)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('❌ No user found')
        return
      }

      console.log('🔍 Current user:', user.id)

      // Fetch client data
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email')
        .eq('id', clientId)
        .single()

      console.log('🔍 Client data result:', { clientData, error })

      if (error) {
        console.error('Error fetching client data:', error)
        return
      }

      console.log('✅ Client data set:', clientData)
      setClientData(clientData)
    } catch (error) {
      console.error('Error fetching client data:', error)
    }
  }

  const fetchAvailableWeeksAndDays = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all training days for this cycle
      const { data: daysData, error } = await supabase
        .from('training_days')
        .select('week_number, day_number')
        .eq('cycle_id', cycleId)
        .eq('trainer_id', user.id)
        .order('week_number', { ascending: true })
        .order('day_number', { ascending: true })

      if (error) {
        console.error('Error fetching available weeks and days:', error)
        return
      }

      // Extract unique weeks and days
      const weeks = [...new Set(daysData?.map(day => day.week_number) || [])]
      const days = [...new Set(daysData?.map(day => day.day_number) || [])]

      setAvailableWeeks(weeks)
      setAvailableDays(days)
    } catch (error) {
      console.error('Error fetching available weeks and days:', error)
    }
  }

  const testSaveProgress = async (exerciseId: string) => {
    try {
      const testProgress = {
        0: { weight: '20', reps: '10' },
        1: { weight: '40', reps: '60' },
        2: { weight: '50', reps: '50' }
      }

      const response = await fetch('/api/set-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId,
          trainingDayId: dayId,
          clientId,
          setProgress: testProgress
        }),
      })

      const data = await response.json()
      console.log('🔧 Test save result:', data)
      
      if (data.success) {
        alert('Test progress saved successfully!')
        // Refresh the current page data
        fetchDayData()
      } else {
        alert('Test save failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error in test save:', error)
      alert('Test save failed')
    }
  }

  const handleLoadSelectedSession = async () => {
    if (!selectedWeek || !selectedDay) {
      alert('Please select both a week and a day')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch the selected training day and its exercises
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
        .eq('cycle_id', cycleId)
        .eq('week_number', parseInt(selectedWeek))
        .eq('day_number', parseInt(selectedDay))
        .eq('trainer_id', user.id)
        .single()

      if (dayError || !dayData) {
        console.error('Error finding training day:', dayError)
        alert('Could not find the selected training session')
        return
      }

      // Fetch exercises for the selected day
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('training_day_id', dayData.id)
        .order('exercise_order', { ascending: true })

      if (exercisesError) {
        console.error('Error fetching exercises:', exercisesError)
      }

      // Fetch progress data for each exercise
      const exercisesWithProgress = await Promise.all(
        (exercisesData || []).map(async (exercise) => {
          try {
            const response = await fetch(`/api/set-progress?exerciseId=${exercise.id}&trainingDayId=${dayData.id}&clientId=${clientId}`)
            const data = await response.json()
            
            console.log(`🔍 Progress for exercise ${exercise.name}:`, data)
            
            return {
              ...exercise,
              progress: data.success ? data.progress : []
            }
          } catch (error) {
            console.error('Error fetching progress for exercise:', exercise.id, error)
            return {
              ...exercise,
              progress: []
            }
          }
        })
      )

      // Calculate completion status based on actual progress
      const totalSets = exercisesWithProgress.reduce((total, exercise) => total + exercise.sets, 0)
      const completedSets = exercisesWithProgress.reduce((total, exercise) => {
        const completedForExercise = Object.values(exercise.progress || {}).filter(
          (set: any) => set.weight && set.reps
        ).length
        return total + completedForExercise
      }, 0)

      console.log(`🔍 Completion analysis: ${completedSets}/${totalSets} sets completed`)

      // Update the day status if there's significant progress but day isn't marked as completed
      let updatedDayData = { ...dayData }
      if (completedSets > 0 && dayData.status === 'pending') {
        // If more than 50% of sets are completed, consider it partially completed
        const completionPercentage = (completedSets / totalSets) * 100
        console.log(`🔍 Completion percentage: ${completionPercentage}%`)
        
        if (completionPercentage >= 50) {
          updatedDayData = {
            ...dayData,
            status: 'completed',
            completed_at: new Date().toISOString()
          }
        }
      }

      // Set the session data and show the details modal
      setSelectedSessionData({
        day: updatedDayData,
        exercises: exercisesWithProgress,
        cycle: dayData.training_programs,
        completionStats: {
          totalSets,
          completedSets,
          percentage: totalSets > 0 ? (completedSets / totalSets) * 100 : 0
        }
      })
      
      setShowNavigationModal(false)
      setShowSessionDetailsModal(true)
    } catch (error) {
      console.error('Error loading selected session:', error)
      alert('Failed to load selected session')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5d90] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exercises...</p>
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
                  onClick={() => router.push(`/trainer/clients/${clientId}/training-cycles/${cycleId}/week/${weekId}`)}
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
              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3 mt-3 sm:mt-0">
                {/* Status Toggle Button */}
                <button
                  onClick={handleToggleStatus}
                  disabled={updatingStatus}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base ${
                    trainingDay?.status === 'completed'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-white text-[#2a5d90] hover:bg-blue-50 border-2 border-white'
                  } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updatingStatus ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-lg">
                      {trainingDay?.status === 'completed' ? '✓' : '○'}
                    </span>
                  )}
                  <span className="font-medium">
                    {trainingDay?.status === 'completed' ? 'Completed' : 'Mark Complete'}
                  </span>
                </button>
                
                {!trainingDay?.is_rest_day && (
                  <button 
                    onClick={() => setShowAddExercise(true)}
                    className="w-full sm:w-auto bg-[#2a5d90] hover:bg-[#1e4a73] px-4 py-2 rounded-lg flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Exercise</span>
                  </button>
                )}
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
                <p className="text-gray-600 mb-6">Add exercises to create a workout plan for this day.</p>
                <button 
                  onClick={() => setShowAddExercise(true)}
                  className="bg-[#2a5d90] hover:bg-[#1e4a73] text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add First Exercise</span>
                </button>
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
                  
                  {/* More Options Menu */}
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingExercise(exercise)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
                          onClick={() => handleOpenYouTubeModal(exercise.youtube_video_url || '', exercise.name)}
                          className={`flex items-center space-x-1 text-xs ${
                            exercise.youtube_video_url 
                              ? 'text-blue-600 cursor-pointer hover:text-blue-800' 
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
                           className="w-full bg-[#2a5d90] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#1e4a73] transition-colors"
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
                onClick={() => setShowNavigationModal(true)}
              >
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Add Exercise Modal */}
        {showAddExercise && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Exercise</h3>
              
              {/* Mode Toggle */}
              <div className="mb-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setExerciseInputMode('search')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      exerciseInputMode === 'search'
                        ? 'bg-white text-[#2a5d90] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Search className="h-4 w-4" />
                      <span>Search Library</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setExerciseInputMode('custom')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      exerciseInputMode === 'custom'
                        ? 'bg-white text-[#2a5d90] shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Custom Exercise</span>
                    </div>
                  </button>
                </div>
              </div>

              {exerciseInputMode === 'search' ? (
                /* Exercise Search Mode */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Exercise Library
                    </label>
                    <ExerciseSearch
                      onSelectExercise={handleSelectExerciseFromLibrary}
                      placeholder="Search for exercises (push-ups, squats, etc.)"
                    />
                  </div>
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-3">
                      Search from our library of exercises or create a custom one
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={() => setExerciseInputMode('custom')}
                        className="text-[#2a5d90] hover:text-[#1e4a73] text-sm font-medium block mx-auto"
                      >
                        Create custom exercise instead →
                      </button>      
                    </div>
                  </div>
                </div>
              ) : (
                /* Custom Exercise Form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sets
                    </label>
                    <input
                      type="number"
                      value={newExercise.sets}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, sets: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exercise Name *
                    </label>
                    <input
                      type="text"
                      value={newExercise.name}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                      placeholder="e.g., Push-ups, Squats, Deadlifts"
                    />
                    {newExercise.name && (
                      <button
                        onClick={() => setExerciseInputMode('search')}
                        className="mt-1 text-xs text-[#2a5d90] hover:text-[#1e4a73]"
                      >
                        ← Search library instead
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rep Range
                      </label>
                      <input
                        type="text"
                        value={newExercise.reps}
                        onChange={(e) => setNewExercise(prev => ({ ...prev, reps: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                        placeholder="e.g., 10, 8-12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rest Time (s)
                      </label>
                      <input
                        type="text"
                        value={newExercise.rest_time}
                        onChange={(e) => setNewExercise(prev => ({ ...prev, rest_time: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                        placeholder="e.g., 60s, 2min"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        YouTube Video URL
                      </label>
                      <input
                        type="url"
                        value={newExercise.youtube_video_url}
                        onChange={(e) => setNewExercise(prev => ({ ...prev, youtube_video_url: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Optional: Add a YouTube video URL for exercise demonstration
                      </p>
                    </div>
                  </div>
                  

                  
                  {/* Advanced Settings Section */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Advanced Settings
                      </label>
                      <div className="flex items-center space-x-2">
                        <select className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-[#2a5d90] focus:border-[#2a5d90]">
                          <option value="basic">Basic</option>
                          <option value="advanced">Advanced</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                          className="text-sm text-[#2a5d90] hover:text-[#1e4a73] flex items-center"
                        >
                          {showAdvancedSettings ? 'Hide' : 'Show'}
                          <svg
                            className={`ml-1 h-4 w-4 transform transition-transform ${
                              showAdvancedSettings ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {showAdvancedSettings && (
                      <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={newExercise.notes}
                      onChange={(e) => setNewExercise(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                      rows={3}
                            placeholder="Any special instructions, form cues, or notes for this exercise"
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Exercise Type
                            </label>
                            <select
                              value={newExercise.exercise_type || 'strength'}
                              onChange={(e) => setNewExercise(prev => ({ ...prev, exercise_type: e.target.value }))}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                            >
                              <option value="strength">Strength</option>
                              <option value="cardio">Cardio</option>
                              <option value="flexibility">Flexibility</option>
                              <option value="balance">Balance</option>
                              <option value="sport">Sport Specific</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Difficulty Level
                            </label>
                            <select
                              value={newExercise.difficulty || 'intermediate'}
                              onChange={(e) => setNewExercise(prev => ({ ...prev, difficulty: e.target.value }))}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                            >
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddExercise(false)
                    setExerciseInputMode('search')
                    setNewExercise({
                      name: '',
                      sets: 3,
                      reps: '',
                      weight: '',
                      rest_time: '',
                      notes: '',
                      exercise_type: 'strength',
                      difficulty: 'intermediate',
                      youtube_video_url: ''
                    })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                {exerciseInputMode === 'custom' && (
                  <button
                    onClick={handleAddExercise}
                    className="flex-1 px-4 py-2 bg-[#2a5d90] text-white rounded-lg hover:bg-[#1e4a73]"
                  >
                    Add Exercise
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Modal */}
        {showNavigationModal && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Select the week and day of training session you would like to view.
              </h3>
              
              {/* Current Selection Display */}
              <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Current:</span>
                  <span className="text-sm font-medium text-gray-900">Week {weekId}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {clientData?.first_name?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {clientData ? 
                      (clientData.first_name && clientData.last_name ? 
                        `${clientData.first_name} ${clientData.last_name}` : 
                        `Client ${clientId.slice(0, 8)}...`
                      ) : 
                      'Loading client...'
                    }
                  </span>
                </div>
              </div>
              
              {/* Week Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Week
                </label>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                >
                  <option value="">-- Select Week --</option>
                  {availableWeeks.map((week) => (
                    <option key={week} value={week}>
                      Week {week}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Day Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Day
                </label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                >
                  <option value="">-- Select Day --</option>
                  {availableDays.map((day) => (
                    <option key={day} value={day}>
                      Day {day}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowNavigationModal(false)
                    setSelectedWeek('')
                    setSelectedDay('')
                  }}
                  className="flex-1 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-[#1e4a73] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleLoadSelectedSession}
                  className="flex-1 px-4 py-2 bg-[#2a5d90] text-white rounded-lg hover:bg-[#1e4a73] transition-colors"
                >
                  Load
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Session Details Modal */}
        {showSessionDetailsModal && selectedSessionData && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Header with Navigation Dropdowns */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>{selectedWeek} week</option>
                  </select>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>Week {selectedWeek}</option>
                  </select>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>Day {selectedDay}</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {clientData?.first_name?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {clientData ? 
                      (clientData.first_name && clientData.last_name ? 
                        `${clientData.first_name} ${clientData.last_name}` : 
                        `Client ${clientId.slice(0, 8)}...`
                      ) : 
                      'Loading client...'
                    }
                  </span>
                </div>
              </div>

              {/* Session Title and Status */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Week {selectedWeek} → Day {selectedDay}
                </h2>
                <div className="flex items-center space-x-2">
                  {selectedSessionData.day.status === 'completed' ? (
                    <>
                      <span className="text-green-500 text-xl">✓</span>
                      <span className="text-green-700 font-medium">Completed</span>
                    </>
                  ) : (
                    <>
                      <span className="text-red-500 text-xl">✗</span>
                      <span className="text-gray-700 font-medium">Not Completed</span>
                    </>
                  )}
                </div>
                {selectedSessionData.completionStats && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">
                      Progress: {selectedSessionData.completionStats.completedSets} of {selectedSessionData.completionStats.totalSets} sets completed 
                      ({selectedSessionData.completionStats.percentage.toFixed(1)}%)
                    </p>
                  </div>
                )}
                {selectedSessionData.day.completed_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Completed on {new Date(selectedSessionData.day.completed_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Exercises List */}
              <div className="space-y-4 mb-6">
                {selectedSessionData.exercises.map((exercise: any, index: number) => (
                  <div key={exercise.id} className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {String.fromCharCode(65 + index)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900">{exercise.name}</h3>
                        <span className="px-2 py-1 bg-pink-500 text-white text-xs font-medium rounded">
                          {exercise.exercise_type?.toUpperCase() || 'STRENGTH'}
                        </span>
                      </div>
                      <div className="text-gray-600 text-sm space-y-1">
                        {Array.from({ length: exercise.sets }, (_, i) => {
                          const setProgress = exercise.progress?.[i] || { weight: '', reps: '' }
                          const isCompleted = setProgress.weight && setProgress.reps
                          
                          return (
                            <div key={i} className={`flex items-center space-x-2 ${
                              isCompleted ? 'text-green-600' : 'text-gray-400'
                            }`}>
                              <span className="text-xs font-medium">Set {i + 1}:</span>
                              {isCompleted ? (
                                <span className="text-xs">
                                  {setProgress.weight} × {setProgress.reps}
                                </span>
                              ) : (
                                <span className="text-xs">×</span>
                              )}

                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowSessionDetailsModal(false)
                    setSelectedSessionData(null)
                    setSessionIntensity(5)
                    setSessionDuration('')
                    setSessionNotes('')
                  }}
                  className="flex-1 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-[#1e4a73] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Navigate to the actual session page
                    router.push(`/trainer/clients/${clientId}/training-cycles/${cycleId}/week/${selectedWeek}/day/${selectedSessionData.day.id}`)
                    setShowSessionDetailsModal(false)
                  }}
                  className="flex-1 px-4 py-2 bg-[#2a5d90] text-white rounded-lg hover:bg-[#1e4a73] transition-colors"
                >
                  Load
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Exercise Modal */}
        {editingExercise && (
          <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Exercise</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exercise Name *
                  </label>
                  <input
                    type="text"
                    value={editingExercise.name}
                    onChange={(e) => setEditingExercise(prev => ({ ...prev!, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sets
                    </label>
                    <input
                      type="number"
                      value={editingExercise.sets}
                      onChange={(e) => setEditingExercise(prev => ({ ...prev!, sets: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reps
                    </label>
                    <input
                      type="text"
                      value={editingExercise.reps}
                      onChange={(e) => setEditingExercise(prev => ({ ...prev!, reps: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                    />
                  </div>
                </div>
                
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rest Time
                    </label>
                    <input
                      type="text"
                      value={editingExercise.rest_time}
                      onChange={(e) => setEditingExercise(prev => ({ ...prev!, rest_time: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      YouTube Video URL
                    </label>
                    <input
                      type="url"
                      value={editingExercise.youtube_video_url || ''}
                      onChange={(e) => setEditingExercise(prev => ({ ...prev!, youtube_video_url: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Add a YouTube video URL for exercise demonstration
                    </p>
                  </div>
                
                {/* Advanced Settings Section */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Advanced Settings
                    </label>
                </div>
                
                  <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={editingExercise.notes}
                    onChange={(e) => setEditingExercise(prev => ({ ...prev!, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                    rows={3}
                        placeholder="Any special instructions, form cues, or notes for this exercise"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Exercise Type
                        </label>
                        <select
                          value={editingExercise.exercise_type || 'strength'}
                          onChange={(e) => setEditingExercise(prev => ({ ...prev!, exercise_type: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                        >
                          <option value="strength">Strength</option>
                          <option value="cardio">Cardio</option>
                          <option value="flexibility">Flexibility</option>
                          <option value="balance">Balance</option>
                          <option value="sport">Sport Specific</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Difficulty Level
                        </label>
                        <select
                          value={editingExercise.difficulty || 'intermediate'}
                          onChange={(e) => setEditingExercise(prev => ({ ...prev!, difficulty: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#2a5d90] focus:border-[#2a5d90]"
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setEditingExercise(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditExercise}
                  className="flex-1 px-4 py-2 bg-[#2a5d90] text-white rounded-lg hover:bg-[#1e4a73]"
                >
                  Save Changes
                </button>
              </div>
            </div>
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
  )
}
