'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Calendar, CheckCircle, Clock, User, Settings, LogOut, ChevronDown } from 'lucide-react'
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
  id: number
  name: string
  completed: boolean
  isCurrentWeek?: boolean
}

export default function ClientTrainingCycles() {
  const router = useRouter()
  const [cycles, setCycles] = useState<TrainingCycle[]>([])
  const [selectedCycle, setSelectedCycle] = useState<TrainingCycle | null>(null)
  const [weeks, setWeeks] = useState<Week[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchClientTrainingCycles()

    // Set up real-time subscription for training programs
    const channel = supabase
      .channel('training-programs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'training_programs'
        },
        (payload) => {
          console.log('Training programs change detected:', payload)
          // Refetch data when changes occur
          fetchClientTrainingCycles()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (selectedCycle) {
      fetchWeeksForCycle()
    }
  }, [selectedCycle])

  const fetchWeeksForCycle = async () => {
    if (!selectedCycle) return

    try {
      // For now, generate weeks based on a simple approach
      // In the future, this should query actual training_days or similar structure
      console.log('Fetching weeks for cycle:', selectedCycle.id)
      
      // Generate 4 weeks by default (can be made dynamic later)
      const totalWeeks = 4
      const cycleStartDate = new Date(selectedCycle.created_at)
      const now = new Date()
      const weeksPassed = Math.floor((now.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
      
      const weeksArray: Week[] = []
      for (let i = 1; i <= totalWeeks; i++) {
        weeksArray.push({
          id: i,
          name: `Week ${i}`,
          completed: i <= weeksPassed && !selectedCycle.is_completed,
          isCurrentWeek: i === weeksPassed + 1 && !selectedCycle.is_completed
        })
      }
      
      setWeeks(weeksArray)
    } catch (error) {
      console.error('Error generating weeks:', error)
      setWeeks([])
    }
  }

  const fetchClientTrainingCycles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setCurrentUser(user)

      console.log('📞 Training page calling /api/client/training-programs for user:', user.email)

      // Use the API endpoint instead of direct database access
      const response = await fetch('/api/client/training-programs')
      
      console.log('📡 Training page API Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Training page API Error Response:', errorText)
        throw new Error(`Failed to fetch training programs: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ Training page API Response data:', data)

      const { client, trainingPrograms } = data
      
      const formattedCycles = (trainingPrograms || []).map((cycle: any) => ({
        ...cycle,
        status: cycle.status || 'active',
        is_completed: cycle.status === 'completed',
        trainer: {
          name: cycle.trainer?.raw_user_meta_data?.full_name || cycle.trainer?.email || 'Your Trainer',
          email: cycle.trainer?.email || ''
        }
      }))

      console.log('🔄 Formatted cycles:', formattedCycles)

      setCycles(formattedCycles)
      
      if (formattedCycles.length > 0) {
        setSelectedCycle(formattedCycles[0])
      }
    } catch (error) {
      console.error('Error fetching training cycles:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateWeeks = (totalWeeks: number) => {
    const weeksArray: Week[] = []
    const cycleStartDate = selectedCycle ? new Date(selectedCycle.created_at) : new Date()
    const now = new Date()
    const weeksPassed = Math.floor((now.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
    
    for (let i = 1; i <= totalWeeks; i++) {
      weeksArray.push({
        id: i,
        name: `Week ${i}`,
        completed: i <= weeksPassed && !selectedCycle?.is_completed,
        isCurrentWeek: i === weeksPassed + 1 && !selectedCycle?.is_completed
      })
    }
    setWeeks(weeksArray)
  }

  const handleSelectWeek = (week: Week) => {
    // Navigate to week details (we'll create this later)
    router.push(`/client/training/week/${selectedCycle?.id}/${week.id}`)
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
          <p className="text-blue-700">Loading your training cycles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex justify-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-b-3xl shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={() => router.push('/client')} className="p-2 hover:bg-blue-700 rounded-lg transition-colors">
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <p className="text-blue-200 text-sm tracking-widest uppercase">My Training</p>
                  <h1 className="text-3xl font-bold">
                    {selectedCycle?.name || 'Training Cycles'}
                  </h1>
                  {selectedCycle && (
                    <p className="text-blue-100 text-sm mt-1">
                      by {selectedCycle.trainer.name}
                    </p>
                  )}
                </div>
              </div>
              {selectedCycle ? (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-blue-200">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Training Cycle</span>
                    </div>
                    {selectedCycle.is_completed && (
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
              ) : (
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
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-8 space-y-8">
          {cycles.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-blue-200 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">No training cycles yet</h3>
                <p className="text-gray-600 mb-4">Your trainer hasn't assigned any training cycles to you yet.</p>
                <p className="text-sm text-gray-500">Contact your trainer to get started with your fitness journey!</p>
              </div>
            </div>
          ) : (
            <>
              {/* Always show Cycle Selection */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Available Training Cycles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cycles.map((cycle) => (
                    <button
                      key={cycle.id}
                      onClick={() => router.push(`/client/training/cycle/${cycle.id}`)}
                      className={`p-6 rounded-xl border text-left transition-all duration-200 font-medium text-lg shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                        selectedCycle?.id === cycle.id
                          ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{cycle.name}</h4>
                          <p className="text-sm text-blue-600 mt-1">Training Cycle</p>
                          {cycle.description && (
                            <p className="text-sm text-gray-500 mt-2">{cycle.description}</p>
                          )}
                        </div>
                        {cycle.is_completed && (
                          <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
