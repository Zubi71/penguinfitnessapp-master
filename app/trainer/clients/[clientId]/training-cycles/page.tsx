'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Plus, CheckCircle, Calendar } from 'lucide-react'
import UserDropdown from '@/components/UserDropdown'

interface TrainingCycle {
  id: string
  name: string
  description: string
  status: string
  created_at: string
  is_completed: boolean
}

export default function TrainingCyclesPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.clientId as string
  
  const [cycles, setCycles] = useState<TrainingCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [newCycleData, setNewCycleData] = useState({
    name: '',
    description: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchTrainingCycles()
  }, [clientId])

  const fetchTrainingCycles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setCurrentUser(user)

      const { data: cyclesData, error } = await supabase
        .from('training_programs')
        .select('*')
        .eq('trainer_id', user.id)
        .eq('client_id', clientId === 'personal-use' ? null : clientId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching training cycles:', error)
        return
      }

      const formattedCycles = (cyclesData || []).map(cycle => ({
        ...cycle,
        status: cycle.status || 'active',
        is_completed: cycle.status === 'completed' || cycle.is_completed === true
      }))

      setCycles(formattedCycles)
    } catch (error) {
      console.error('Error fetching training cycles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCycle = async () => {
    if (!newCycleData.name.trim()) {
      alert('Please enter a cycle name')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('You must be logged in to create a cycle')
        return
      }

      const cycleData = {
        trainer_id: user.id,
        client_id: clientId === 'personal-use' ? null : clientId,
        name: newCycleData.name,
        description: newCycleData.description,
        is_active: true
      }

      // Try to add status column if it exists
      try {
        const { data, error } = await supabase
          .from('training_programs')
          .insert([{ ...cycleData, status: 'active' }])
          .select()
          .single()

        if (error) throw error
        
        const newCycle = { ...data, is_completed: false }
        setCycles(prev => [newCycle, ...prev])
        setShowCreateModal(false)
        setNewCycleData({ name: '', description: '' })
        
      } catch (statusError) {
        // If status column doesn't exist, insert without it
        console.log('Status column might not exist, trying without it...')
        
        const { data, error } = await supabase
          .from('training_programs')
          .insert([cycleData])
          .select()
          .single()

        if (error) throw error
        
        const newCycle = { ...data, is_completed: false, status: 'active' }
        setCycles(prev => [newCycle, ...prev])
        setShowCreateModal(false)
        setNewCycleData({ name: '', description: '' })
      }

    } catch (error) {
      console.error('Error creating cycle:', error)
      const errorMessage = error instanceof Error ? error.message : 'Please try again.'
      alert(`Failed to create cycle: ${errorMessage}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5d90] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading training cycles...</p>
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
                  onClick={() => router.push(`/trainer/clients/${clientId}`)}
                  className="p-2 hover:bg-[#1e4a73] rounded-lg"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <p className="text-blue-200 text-sm">TRAINING</p>
                  <h1 className="text-2xl font-bold">Training Cycles</h1>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-[#1e4a73] hover:bg-[#16405e] px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>New Cycle</span>
              </button>
              
              {/* User Dropdown Menu */}
              <UserDropdown userEmail={currentUser?.email} variant="dark" />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {cycles.length === 0 ? (
            /* No Cycles State */
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center py-8">
                <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No training cycles yet</h3>
                <p className="text-gray-600 mb-6">Create the first training cycle for this client.</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#2a5d90] hover:bg-[#1e4a73] text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Training Cycle</span>
                </button>
              </div>
            </div>
          ) : (
            /* Training Cycles List */
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Cycles</h3>
              <div className="space-y-3">
                {cycles.map((cycle) => (
                  <button
                    key={cycle.id}
                    onClick={() => router.push(`/trainer/clients/${clientId}/training-cycles/${cycle.id}`)}
                    className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{cycle.name}</span>
                        {cycle.is_completed && (
                          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{cycle.description}</p>
                      <p className="text-xs text-gray-400 mt-1">Created {new Date(cycle.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cycle.is_completed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {cycle.is_completed ? 'Completed' : 'Active'}
                      </span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Create Cycle Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Create New Training Cycle</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault()
                handleCreateCycle()
              }} className="space-y-4">
                <div>
                  <label htmlFor="cycle-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Cycle Name *
                  </label>
                  <input
                    type="text"
                    id="cycle-name"
                    required
                    value={newCycleData.name}
                    onChange={(e) => setNewCycleData({ ...newCycleData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a5d90] focus:border-transparent"
                    placeholder="e.g., 8 Weeks Recomp"
                  />
                </div>

                <div>
                  <label htmlFor="cycle-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="cycle-description"
                    value={newCycleData.description}
                    onChange={(e) => setNewCycleData({ ...newCycleData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a5d90] focus:border-transparent"
                    rows={3}
                    placeholder="Brief description of the training cycle..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#2a5d90] text-white rounded-lg hover:bg-[#1e4a73] transition-colors"
                  >
                    Create Cycle
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
