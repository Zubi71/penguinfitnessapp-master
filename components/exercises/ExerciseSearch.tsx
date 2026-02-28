'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'

interface Exercise {
  id: string
  name: string
  category: string
  subcategory?: string
  equipment?: string
  muscle_groups: string[]
  default_sets: number
  default_reps?: string
  default_rest_time?: string
}

interface ExerciseSearchProps {
  onSelectExercise: (exercise: Exercise) => void
  placeholder?: string
  className?: string
}

const ExerciseSearch: React.FC<ExerciseSearchProps> = ({ 
  onSelectExercise, 
  placeholder = "Search for exercises...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(false)
  const [setupRequired, setSetupRequired] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch exercises from API
  const fetchExercises = async (query: string = '', category: string = 'all') => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.append('q', query)
      if (category && category !== 'all') params.append('category', category)
      params.append('limit', '50')

      const response = await fetch(`/api/exercises/search?${params}`)
      const data = await response.json()

      if (response.ok) {
        setExercises(data.exercises || [])
        if (data.categories) {
          setCategories(data.categories)
        }
      } else {
        console.error('Error fetching exercises:', data.error)
        // Show user-friendly error message
        if (data.code === 'TABLE_NOT_FOUND') {
          setSetupRequired(true)
          console.log('Exercise library setup required - check SETUP_EXERCISE_LIBRARY.md')
        } else {
          alert('Failed to load exercises. Please try again later.')
        }
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
      alert('Failed to connect to exercise database. Please check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isOpen) {
        fetchExercises(searchQuery, selectedCategory)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedCategory, isOpen])

  // Initial load when opened
  useEffect(() => {
    if (isOpen && exercises.length === 0) {
      fetchExercises()
    }
  }, [isOpen])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectExercise = (exercise: Exercise) => {
    onSelectExercise(exercise)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleOpen = () => {
    setIsOpen(true)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div
        onClick={handleOpen}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 cursor-text focus-within:ring-2 focus-within:ring-[#2a5d90] focus-within:border-[#2a5d90] transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 outline-none bg-transparent"
            onFocus={() => setIsOpen(true)}
          />
          {isOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
                setSearchQuery('')
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Category Filter */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-[#2a5d90]"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Exercise List */}
          <div className="max-h-64 overflow-y-auto">
            {setupRequired ? (
              <div className="p-4 text-center">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-yellow-800 font-medium mb-2">
                    🔧 Exercise Library Setup Required
                  </div>
                  <div className="text-sm text-yellow-700 mb-3">
                    The exercise library needs to be set up in your database first.
                  </div>
                  <div className="text-xs text-yellow-600 space-y-1">
                    <p><strong>Quick Setup:</strong></p>
                    <p>1. Go to Supabase Dashboard → SQL Editor</p>
                    <p>2. Run: <code className="bg-yellow-100 px-1 rounded">supabase/migrations/create_exercise_library.sql</code></p>
                    <p>3. Refresh this page</p>
                  </div>
                  <div className="mt-3">
                    <a 
                      href="https://supabase.com/dashboard" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded hover:bg-yellow-700 transition-colors"
                    >
                      Open Supabase Dashboard →
                    </a>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2a5d90] mx-auto mb-2"></div>
                Searching exercises...
              </div>
            ) : exercises.length > 0 ? (
              <div className="py-1">
                {exercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => handleSelectExercise(exercise)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{exercise.name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs mr-2">
                            {exercise.category}
                          </span>
                          {exercise.equipment && (
                            <span className="inline-block bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs mr-2">
                              {exercise.equipment}
                            </span>
                          )}
                          {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {exercise.muscle_groups.slice(0, 2).join(', ')}
                              {exercise.muscle_groups.length > 2 && '...'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 ml-2">
                        {exercise.default_sets} sets
                        {exercise.default_reps && ` × ${exercise.default_reps}`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No exercises found matching your search.' : 'Start typing to search exercises...'}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
            <p className="text-xs text-gray-500">
              Can't find what you're looking for? You can still add custom exercises.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExerciseSearch
