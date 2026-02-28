import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, FileText, X, Save, Loader2 } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

interface Instruction {
  id: string
  title: string
  content: string
  created_at: string
}

interface InstructionsProps {
  clientId: string
  onBack: () => void
}

const Instructions: React.FC<InstructionsProps> = ({ clientId, onBack }) => {
  const [instructions, setInstructions] = useState<Instruction[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newInstruction, setNewInstruction] = useState({
    title: '',
    content: ''
  })

  useEffect(() => {
    fetchInstructions()
  }, [clientId])

  const fetchInstructions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/training-instructions?clientId=${clientId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch instructions')
      }
      
      const data = await response.json()
      setInstructions(data.instructions || [])
    } catch (error) {
      console.error('Error fetching instructions:', error)
      setInstructions([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddInstruction = async () => {
    if (!newInstruction.title.trim() || !newInstruction.content.trim()) {
      alert('Please fill in all fields')
      return
    }

    try {
      setSaving(true)
      const response = await fetch('/api/training-instructions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          title: newInstruction.title.trim(),
          content: newInstruction.content.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create instruction')
      }

      const data = await response.json()
      setInstructions([data.instruction, ...instructions])
      setNewInstruction({ title: '', content: '' })
      setShowAddForm(false)
    } catch (error) {
      console.error('Error creating instruction:', error)
      alert('Failed to create instruction. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteInstruction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this instruction?')) {
      return
    }

    try {
      const response = await fetch(`/api/training-instructions?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete instruction')
      }

      setInstructions(instructions.filter(instruction => instruction.id !== id))
    } catch (error) {
      console.error('Error deleting instruction:', error)
      alert('Failed to delete instruction. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="bg-[#2a5d90] text-white p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={onBack} className="p-2 hover:bg-[#1e4a73] rounded-lg">
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <p className="text-blue-200 text-sm">CLIENT INSTRUCTIONS</p>
                  <h1 className="text-2xl font-bold">Training Instructions</h1>
                </div>
              </div>
              <button 
                onClick={() => setShowAddForm(true)}
                className="bg-[#1e4a73] hover:bg-[#164066] px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add New Instruction</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Add New Instruction Form */}
          {showAddForm && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add New Instruction</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instruction Title
                  </label>
                  <input
                    type="text"
                    value={newInstruction.title}
                    onChange={(e) => setNewInstruction({ ...newInstruction, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a5d90]"
                    placeholder="Enter instruction title..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instruction Content
                  </label>
                  <textarea
                    value={newInstruction.content}
                    onChange={(e) => setNewInstruction({ ...newInstruction, content: e.target.value })}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a5d90]"
                    placeholder="Enter detailed instruction content..."
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleAddInstruction}
                    disabled={saving}
                    className="bg-[#2a5d90] hover:bg-[#1e4a73] disabled:bg-[#5a7ba8] text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Instruction</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instructions List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Available Instructions ({instructions.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-spin" />
                <p className="text-gray-500">Loading instructions...</p>
              </div>
            ) : instructions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No instructions added yet.</p>
                <p className="text-sm text-gray-400">Click "Add New Instruction" to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {instructions.map((instruction) => (
                  <div
                    key={instruction.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{instruction.title}</h4>
                      </div>
                      <button
                        onClick={() => handleDeleteInstruction(instruction.id)}
                        className="p-1 hover:bg-gray-100 rounded-full"
                      >
                        <X className="h-4 w-4 text-gray-500 hover:text-[#2a5d90]" />
                      </button>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">{instruction.content}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Created: {new Date(instruction.created_at).toLocaleDateString()}</span>
                      <FileText className="h-4 w-4" />
                    </div>
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

export default Instructions
