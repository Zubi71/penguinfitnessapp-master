'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Calendar, CheckCircle, Clock, User, Settings, LogOut, ChevronDown, Dumbbell } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TrainingCycle {
  id: string
  name: string
  description: string
  status: string
  created_at: string
  is_completed: boolean
  trainer: {
    name: string
    email: string
  }
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
  days: Array<{
    id: string
    day_number: number
    day_name: string
    status: string
    is_rest_day: boolean
  }>
  created_at: string
}

export default function TrainingCycleDetail() {
  const router = useRouter()
  const params = useParams()
  const cycleId = params.cycleId as string
  
  const [cycle, setCycle] = useState<TrainingCycle | null>(null)
  const [weeks, setWeeks] = useState<Week[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchCycleData()
  }, [cycleId])

  const fetchCycleData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setCurrentUser(user)

      console.log('📞 Fetching cycle data for cycleId:', cycleId)

      // Fetch cycle details
      const cycleResponse = await fetch(`/api/client/training-programs`)
      
      if (!cycleResponse.ok) {
        throw new Error(`Failed to fetch cycle data: ${cycleResponse.status}`)
      }

      const cycleData = await cycleResponse.json()
      const { trainingPrograms } = cycleData
      
      const currentCycle = trainingPrograms.find((c: any) => c.id === cycleId)
      
      if (!currentCycle) {
        router.push('/client/training')
        return
      }

      const formattedCycle: TrainingCycle = {
        ...currentCycle,
        status: currentCycle.status || 'active',
        is_completed: currentCycle.status === 'completed',
        trainer: {
          name: currentCycle.trainer?.raw_user_meta_data?.full_name || currentCycle.trainer?.email || 'Your Trainer',
          email: currentCycle.trainer?.email || ''
        }
      }

      setCycle(formattedCycle)

      // Fetch weeks for this cycle
      await fetchWeeksForCycle(cycleId)

    } catch (error) {
      console.error('Error fetching cycle data:', error)
      router.push('/client/training')
    } finally {
      setLoading(false)
    }
  }

  const fetchWeeksForCycle = async (cycleId: string) => {
    try {
      console.log('📞 Fetching weeks for cycle:', cycleId)
      
      // Fetch weeks from the API endpoint
      const response = await fetch(`/api/client/training-weeks/${cycleId}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        throw new Error(`Failed to fetch weeks: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ Weeks API Response data:', data)

      const { weeks } = data
      setWeeks(weeks || [])
      
    } catch (error) {
      console.error('Error fetching weeks:', error)
      setWeeks([])
    }
  }

  const handleSelectWeek = (week: Week) => {
    router.push(`/client/training/cycle/${cycleId}/week/${week.id}`)
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
          <p className="text-blue-700">Loading training cycle...</p>
        </div>
      </div>
    )
  }

  if (!cycle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-blue-200 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-800 mb-3">Cycle not found</h3>
          <button 
            onClick={() => router.push('/client/training')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Training Cycles
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
                <button onClick={() => router.push('/client/training')} className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <p className="text-blue-200 text-sm tracking-widest uppercase">Training Cycle</p>
                  <h1 className="text-3xl font-bold">
                    {cycle.name}
                  </h1>
                  <p className="text-blue-100 text-sm mt-1">
                    by {cycle.trainer.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-blue-200">
                    <Dumbbell className="h-4 w-4" />
                    <span className="text-sm">Training Cycle</span>
                  </div>
                  {cycle.is_completed && (
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
          {/* Cycle Description */}
          {cycle.description && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Cycle Description</h3>
              <p className="text-gray-600">{cycle.description}</p>
            </div>
          )}

          {/* Weeks Grid */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-semibold text-gray-800">Training Weeks</h3>
              <div className="text-sm text-blue-600">
                Created by your trainer
              </div>
            </div>

            {weeks.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-blue-200 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-800 mb-3">No training weeks assigned yet</h3>
                <p className="text-gray-600">Your trainer hasn't created any training weeks for this cycle yet.</p>
                <p className="text-sm text-gray-500 mt-2">Check back later or contact your trainer to get started!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {weeks.map((week) => (
                    <button
                      key={week.id}
                      onClick={() => handleSelectWeek(week)}
                      className={`relative p-6 rounded-xl border text-center transition-all duration-200 hover:scale-105 font-medium text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                        week.is_current_week
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                          : week.is_completed
                          ? 'border-blue-200 bg-blue-100'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 mb-1">{week.name}</div>
                      <div className="text-xs text-blue-600">
                        {week.is_current_week ? 'Current Week' : week.is_completed ? 'Completed' : 'Upcoming'}
                      </div>
                      {/* Status indicator */}
                      <div className="absolute top-3 right-3">
                        {week.is_current_week && (
                          <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                        )}
                        {week.is_completed && (
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        )}
                        {!week.is_current_week && !week.is_completed && (
                          <Clock className="w-4 h-4 text-blue-300" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mt-8">
                  <div className="flex items-center justify-between text-sm text-blue-600 mb-2">
                    <span>Progress</span>
                    <span>
                      {weeks.filter(w => w.is_completed).length}/{weeks.length} weeks completed
                    </span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${(weeks.filter(w => w.is_completed).length / weeks.length) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 