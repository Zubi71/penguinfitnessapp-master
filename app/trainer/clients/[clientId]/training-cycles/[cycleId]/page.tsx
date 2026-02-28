'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Plus } from 'lucide-react'

interface TrainingCycle {
  id: string
  name: string
  description: string
  created_at: string
}

interface Week {
  id: number
  name: string
}

export default function CycleManagement() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.clientId as string
  const cycleId = params.cycleId as string
  
  const [cycle, setCycle] = useState<TrainingCycle | null>(null)
  const [weeks, setWeeks] = useState<Week[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchCycleAndWeeks()
  }, [cycleId])

  const fetchCycleAndWeeks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch the training cycle
      const { data: cycleData, error: cycleError } = await supabase
        .from('training_programs')
        .select('*')
        .eq('id', cycleId)
        .eq('trainer_id', user.id)
        .single()

      if (cycleError) {
        console.error('Error fetching cycle:', cycleError)
        router.push(`/trainer/clients/${clientId}/training-cycles`)
        return
      }

      const formattedCycle = {
        ...cycleData,
      }

      setCycle(formattedCycle)

      // Fetch weeks for this cycle
      const { data: weeksData, error: weeksError } = await supabase
        .from('training_days')
        .select('week_number')
        .eq('cycle_id', cycleId)
        .order('week_number', { ascending: true })

      if (weeksError) {
        console.error('Error fetching weeks:', weeksError)
        setWeeks([])
        return
      }

      // Get unique week numbers
      const uniqueWeeks = [...new Set(weeksData?.map(d => d.week_number) || [])]
      
      if (uniqueWeeks.length === 0) {
        setWeeks([])
        return
      }

      const weeksArray: Week[] = uniqueWeeks.map(weekNum => ({
        id: weekNum,
        name: `Week ${weekNum}`,
      }))

      setWeeks(weeksArray)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectWeek = (week: Week) => {
    router.push(`/trainer/clients/${clientId}/training-cycles/${cycleId}/week/${week.id}`)
  }

  const handleDuplicateWeek = async (weekId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // 1. Fetch all training days for the selected week (with exercises)
      const { data: daysData, error: daysError } = await supabase
        .from('training_days')
        .select('*, exercises(*)')
        .eq('cycle_id', cycleId)
        .eq('week_number', weekId)
        .order('day_number', { ascending: true })

      if (daysError) {
        console.error('Error fetching days to duplicate:', daysError)
        alert('Failed to fetch days for duplication.')
        return
      }
      if (!daysData || daysData.length === 0) {
        alert('No days found in this week to duplicate.')
        return
      }

      // 2. Determine the new week number
      const newWeekNumber = Math.max(...weeks.map(w => w.id)) + 1

      // 3. For each day, insert a new training day for the new week
      const newDayIds: string[] = []
      for (const day of daysData) {
        const { data: newDay, error: newDayError } = await supabase
          .from('training_days')
          .insert({
            cycle_id: cycleId,
            week_number: newWeekNumber,
            day_number: day.day_number,
            day_name: day.day_name,
            description: day.description,
            is_rest_day: day.is_rest_day,
            trainer_id: user.id,
            status: 'pending',
            completed_at: null
          })
          .select()
          .single()
        if (newDayError) {
          console.error('Error duplicating training day:', newDayError)
          alert('Failed to duplicate a training day.')
          return
        }
        newDayIds.push(newDay.id)

        // 4. For each exercise in the day, insert a new exercise for the new training day
        if (day.exercises && Array.isArray(day.exercises)) {
          for (const exercise of day.exercises) {
            const { error: exError } = await supabase
              .from('exercises')
              .insert({
                training_day_id: newDay.id,
                trainer_id: user.id,
                exercise_order: exercise.exercise_order || 1,
                name: exercise.name,
                sets: exercise.sets,
                reps: exercise.reps,
                weight: exercise.weight,
                rest_time: exercise.rest_time,
                notes: exercise.notes
              })
            if (exError) {
              console.error('Error duplicating exercise:', exError)
              alert('Failed to duplicate an exercise.')
              // Continue duplicating other exercises/days
            }
          }
        }
      }

      // 5. Refresh the weeks list and redirect to the new week
      await fetchCycleAndWeeks()
      router.push(`/trainer/clients/${clientId}/training-cycles/${cycleId}/week/${newWeekNumber}`)
    } catch (error) {
      console.error('Error duplicating week:', error)
      alert('Failed to duplicate week. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5d90] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cycle...</p>
        </div>
      </div>
    )
  }

  if (!cycle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cycle not found</p>
          <button
            onClick={() => router.push(`/trainer/clients/${clientId}/training-cycles`)}
            className="mt-4 text-[#2a5d90] hover:text-[#1e4a73]"
          >
            ← Back to Training Cycles
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-[#2a5d90] text-white p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4 w-full">
                <button 
                  onClick={() => router.push(`/trainer/clients/${clientId}/training-cycles`)}
                  className="p-2 hover:bg-[#1e4a73] rounded-lg"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-blue-200 text-xs sm:text-sm truncate">TRAINING CYCLE</p>
                  <h1 className="text-xl sm:text-2xl font-bold flex items-center space-x-2 truncate">
                    <span className="truncate">{cycle.name}</span>
                  </h1>
                  <p className="text-blue-200 text-xs sm:text-sm mt-1 truncate">{cycle.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
          {/* Cycle Info */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                  <span>Training Cycle</span>
                  <span>Created {new Date(cycle.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weeks Management */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Training Weeks</h3>
            
            <div className="space-y-3">
              {weeks.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Ready to build your training cycle</h4>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">Create your first week and start adding training days and exercises.</p>
                  <button
                    onClick={() => router.push(`/trainer/clients/${clientId}/training-cycles/${cycleId}/week/1`)}
                    className="bg-[#2a5d90] hover:bg-[#1e4a73] text-white px-4 sm:px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto text-sm sm:text-base"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Start Week 1</span>
                  </button>
                </div>
              ) : (
                <>
                  {weeks.map((week) => (
                    <div key={week.id} className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                      <button
                        onClick={() => handleSelectWeek(week)}
                        className={
                          'flex-1 p-3 sm:p-4 text-left border rounded-lg transition-colors flex items-center justify-between border-gray-200 hover:bg-gray-50 text-sm sm:text-base'
                        }
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <span className="font-medium text-gray-900 truncate">
                            {week.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                      <button
                        onClick={() => handleDuplicateWeek(week.id)}
                        className="w-full sm:w-auto px-3 py-2 bg-gray-100 hover:bg-blue-100 text-gray-700 rounded-lg text-xs sm:text-sm border border-gray-200 mt-2 sm:mt-0"
                        title="Duplicate this week"
                      >
                        Duplicate
                      </button>
                    </div>
                  ))}
                  {/* Add Next Week Button */}
                  {weeks.length > 0 && (
                    <button
                      onClick={() => {
                        const nextWeekNumber = Math.max(...weeks.map(w => w.id)) + 1
                        router.push(`/trainer/clients/${clientId}/training-cycles/${cycleId}/week/${nextWeekNumber}`)
                      }}
                      className="w-full p-3 sm:p-4 text-left border-2 border-dashed border-gray-300 rounded-lg hover:border-[#2a5d90] hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2 text-gray-600 hover:text-[#2a5d90] text-sm sm:text-base"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Add Week {Math.max(...weeks.map(w => w.id)) + 1}</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
