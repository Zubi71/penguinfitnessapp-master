'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Activity, Calendar, User, TrendingUp, Clock, CheckCircle, FileText, Dumbbell, Target, BarChart3, MessageSquare } from 'lucide-react'
import UserDropdown from '@/components/UserDropdown'

interface ClientData {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
}

interface TrainingCycle {
  id: string
  name: string
  description: string
  status: string
  created_at: string
  is_completed: boolean
}

interface NextTrainingDay {
  id: string
  day_number: number
  date: string
  status: string
  training_cycle: {
    name: string
  }
}

export default function ClientDashboard() {
  const router = useRouter()
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [trainingCycles, setTrainingCycles] = useState<TrainingCycle[]>([])
  const [nextTrainingDay, setNextTrainingDay] = useState<NextTrainingDay | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchClientData()
  }, [])

  const fetchClientData = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        router.push('/login')
        return
      }

      console.log('📞 Calling /api/client/training-programs for user:', user.email)

      // First test if API is accessible at all
      try {
        const testResponse = await fetch('/api/test')
        console.log('🧪 Test API Response:', testResponse.status)
      } catch (testError) {
        console.error('🧪 Test API failed:', testError)
      }

      // Use API endpoint to get client data and training programs
      const response = await fetch('/api/client/training-programs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('📡 API Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        throw new Error(`Failed to fetch client data: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ API Response data:', data)

      const { client, trainingPrograms } = data
      setClientData(client)
      setTrainingCycles(trainingPrograms)

      // For now, skip the next training day query since we need to understand the schema better
      // TODO: Implement next training day query once training_days table structure is confirmed

    } catch (error) {
      console.error('Error fetching client data:', error)
      // Don't redirect on error, just show the error state
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const activeCycles = trainingCycles.filter(cycle => cycle.status === 'active')
  const completedCycles = trainingCycles.filter(cycle => cycle.is_completed)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Welcome back, {clientData?.first_name}! 👋
                </h1>
                <p className="text-blue-100 text-lg">Ready for your next training session?</p>
              </div>
              <div className="flex items-center space-x-4">
                {/* User Dropdown Menu */}
                <UserDropdown userEmail={clientData?.email} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Cycles</p>
                <p className="text-3xl font-bold text-blue-600">{activeCycles.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Cycles</p>
                <p className="text-3xl font-bold text-green-600">{completedCycles.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Cycles</p>
                <p className="text-3xl font-bold text-indigo-600">{trainingCycles.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => router.push('/client/training')}
              className="bg-white cursor-pointer rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 text-left group border border-gray-100 hover:border-blue-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Dumbbell className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">View Training</p>
                  <p className="text-sm text-gray-500">Access your training cycles</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/client/instructions')}
              className="bg-white cursor-pointer rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 text-left group border border-gray-100 hover:border-blue-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <FileText className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">View Instructions</p>
                  <p className="text-sm text-gray-500">Training guidance from your trainer</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/client/tracker')}
              className="bg-white rounded-xl cursor-pointer shadow-lg p-6 hover:shadow-xl transition-all duration-300 text-left group border border-gray-100 hover:border-blue-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors">
                    <BarChart3 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">My Progress</p>
                  <p className="text-sm text-gray-500">Track your fitness journey</p>
                </div>
              </div>
            </button>
            
            <button
              onClick={() => router.push('/client/feedback')}
              className="bg-white cursor-pointer rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 text-left group border border-gray-100 hover:border-blue-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <MessageSquare className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">Class Feedback</p>
                  <p className="text-sm text-gray-500">Share your experience with us</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Next Training Day */}
        {nextTrainingDay && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-3">Next Training Session</h2>
                <div className="flex items-center text-blue-100 mb-2">
                  <Calendar className="h-5 w-5 mr-2" />
                  <span className="text-lg">{new Date(nextTrainingDay.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-blue-100">
                  <Clock className="h-5 w-5 mr-2" />
                  <span className="text-lg">Day {nextTrainingDay.day_number} - {nextTrainingDay.training_cycle.name}</span>
                </div>
              </div>
              <button
                onClick={() => router.push('/client/training')}
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-semibold transition-colors shadow-lg"
              >
                Start Training
              </button>
            </div>
          </div>
        )}

        {/* Training Cycles Overview */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Your Training Cycles</h2>
              <button
                onClick={() => router.push('/client/training')}
                className="text-blue-600 hover:text-blue-700 font-semibold text-lg transition-colors"
              >
                View All →
              </button>
            </div>
          </div>

          <div className="p-8">
            {trainingCycles.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-blue-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Activity className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">No Training Cycles Yet</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Your trainer will assign training cycles to you. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trainingCycles.slice(0, 4).map((cycle) => (
                  <div
                    key={cycle.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-blue-300 bg-gradient-to-br from-white to-blue-50"
                    onClick={() => router.push('/client/training')}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 text-lg">{cycle.name}</h3>
                      <span
                        className={`px-3 py-1 text-sm rounded-full font-medium ${
                          cycle.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : cycle.is_completed
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {cycle.is_completed ? 'Completed' : cycle.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{cycle.description}</p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(cycle.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
