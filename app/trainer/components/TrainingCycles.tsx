import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, HelpCircle, Calendar, Users, Target } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface TrainingCycle {
  id: string
  client_id: string
  name: string
  description: string
  start_date: string
  end_date: string
  status: string
  weeks: number
  created_at: string
}

interface TrainingCyclesProps {
  onSelectCycle: (cycle: TrainingCycle) => void
  onBack: () => void
}

const TrainingCycles: React.FC<TrainingCyclesProps> = ({ onSelectCycle, onBack }) => {
  const [cycles, setCycles] = useState<TrainingCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCycle, setNewCycle] = useState({
    name: '',
    description: '',
    weeks: 4,
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  })

  const supabase = createClient()

  // Fetch training cycles from database
  const fetchCycles = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('User not authenticated')
        return
      }

      const { data, error: cyclesError } = await supabase
        .from('training_cycles')
        .select('*')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })

      if (cyclesError) {
        console.error('Error fetching cycles:', cyclesError)
        setError('Failed to fetch training cycles')
        return
      }

      setCycles(data || [])
    } catch (error) {
      console.error('Error in fetchCycles:', error)
      setError('Failed to load training cycles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCycles()
  }, [])

  // Create new training cycle
  const handleCreateCycle = async () => {
    try {
      if (!newCycle.name.trim()) {
        alert('Please enter a cycle name')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('User not authenticated')
        return
      }

      // Calculate end date if not provided
      const endDate = newCycle.end_date || (() => {
        const start = new Date(newCycle.start_date)
        start.setDate(start.getDate() + (newCycle.weeks * 7))
        return start.toISOString().split('T')[0]
      })()

      const { data, error } = await supabase
        .from('training_cycles')
        .insert([
          {
            ...newCycle,
            end_date: endDate,
            trainer_id: user.id,
            client_id: 'personal-use', // For now, default to personal use
            status: 'active'
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating cycle:', error)
        setError('Failed to create training cycle')
        return
      }

      setCycles(prevCycles => [data, ...prevCycles])
      setShowCreateModal(false)
      setNewCycle({
        name: '',
        description: '',
        weeks: 4,
        start_date: new Date().toISOString().split('T')[0],
        end_date: ''
      })
    } catch (error) {
      console.error('Error in handleCreateCycle:', error)
      setError('Failed to create training cycle')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading training cycles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button 
            onClick={fetchCycles}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-4xl">
      {/* Header */}
      <div className="bg-red-500 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={onBack} className="p-2 hover:bg-red-600 rounded-lg">
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold">Training Cycles</h1>
                <HelpCircle className="h-5 w-5 text-red-200" />
              </div>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Cycle</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {cycles.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No training cycles yet</h3>
            <p className="text-gray-500 mb-6">Create your first training cycle to get started</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600"
            >
              Create Training Cycle
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cycles.map((cycle) => (
              <button
                key={cycle.id}
                onClick={() => onSelectCycle(cycle)}
                className="w-full bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{cycle.name}</h3>
                      <p className="text-gray-500">{cycle.weeks} weeks</p>
                      {cycle.description && (
                        <p className="text-sm text-gray-400 mt-1">{cycle.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(cycle.start_date).toLocaleDateString()}</span>
                        </div>
                        {cycle.end_date && (
                          <div className="flex items-center space-x-1">
                            <span>to</span>
                            <span>{new Date(cycle.end_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                        cycle.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : cycle.status === 'completed'
                          ? 'bg-[#2a5d90]/10 text-[#2a5d90]'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {cycle.status}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Cycle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Training Cycle</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cycle Name *
                </label>
                <input
                  type="text"
                  value={newCycle.name}
                  onChange={(e) => setNewCycle({ ...newCycle, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Strength Building Phase 1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newCycle.description}
                  onChange={(e) => setNewCycle({ ...newCycle, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="Describe the goals and focus of this cycle"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (weeks)
                  </label>
                  <input
                    type="number"
                    value={newCycle.weeks}
                    onChange={(e) => setNewCycle({ ...newCycle, weeks: parseInt(e.target.value) || 4 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    min="1"
                    max="52"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newCycle.start_date}
                    onChange={(e) => setNewCycle({ ...newCycle, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCycle}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Create Cycle
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default TrainingCycles
