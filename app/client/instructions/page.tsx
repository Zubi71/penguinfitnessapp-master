"use client"
import React, { useState, useEffect } from 'react'
import { FileText, User, Calendar, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Instruction {
  id: string
  title: string
  content: string
  created_at: string
}

export default function ClientInstructionsPage() {
  const [instructions, setInstructions] = useState<Instruction[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchInstructions()
  }, [])

  const fetchInstructions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Single API call to get instructions directly
      const response = await fetch('/api/training-instructions/client-instructions')
      
      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch instructions')
      }
      
      const data = await response.json()
      setInstructions(data.instructions || [])
      setCurrentUser(data.user || { email: 'Client' })
    } catch (error) {
      console.error('Error fetching instructions:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
      setInstructions([])
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full">
          <div className="text-center">
            <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Instructions</h2>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchInstructions}
              className="bg-[#2a5d90] text-white px-4 py-2 rounded-lg hover:bg-[#1e4a7a] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-[#2a5d90] p-3 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Training Instructions</h1>
                <p className="text-gray-500">Your personalized workout guidance</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <User className="h-4 w-4" />
              <span>{currentUser?.email}</span>
            </div>
          </div>
        </div>

        {/* Instructions List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Training Instructions ({instructions.length})
          </h3>
          
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-gray-400 mx-auto mb-3 animate-spin" />
              <p className="text-gray-500">Loading your instructions...</p>
            </div>
          ) : instructions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No instructions available yet.</p>
              <p className="text-sm text-gray-400">
                Your trainer will add personalized instructions for you.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {instructions.map((instruction) => (
                <div
                  key={instruction.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{instruction.title}</h4>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>Added on {new Date(instruction.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <FileText className="h-6 w-6 text-gray-400" />
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {instruction.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
