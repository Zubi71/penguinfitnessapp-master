import React, { useState } from 'react'
import { ArrowLeft, Plus, MoreHorizontal, Info, Clock } from 'lucide-react'

interface WorkoutDayProps {
  day: any
  cycle: any
  onBack: () => void
}

const WorkoutDay: React.FC<WorkoutDayProps> = ({ day, cycle, onBack }) => {
  const [exercises] = useState([
    {
      id: 1,
      name: 'Leg Press',
      sets: 4,
      reps: '1-12',
      rest: '60s',
      category: 'LEGS',
      categoryColor: 'bg-[#2a5d90]'
    },
    {
      id: 2,
      name: 'Lat Pulldowns',
      sets: 4,
      reps: '10-12',
      rest: '60s',
      category: 'BACK',
      categoryColor: 'bg-[#2a5d90]'
    },
    {
      id: 3,
      name: 'Leg Extensions',
      sets: 4,
      reps: '10-12',
      rest: '60s',
      category: 'LEGS',
      categoryColor: 'bg-[#2a5d90]'
    },
    {
      id: 4,
      name: 'Machine Shoulder Press',
      sets: 4,
      reps: '10-12',
      rest: '60s',
      category: 'SHOULDERS',
      categoryColor: 'bg-[#2a5d90]'
    }
  ])

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
                <div className="flex items-center space-x-2 text-blue-200 text-sm">
                  <span>CYCLE</span>
                  <span>•</span>
                  <span>WEEK</span>
                  <span>•</span>
                  <span>DAY</span>
                </div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold">DAY 1</h1>
                  <Info className="h-5 w-5 text-blue-200" />
                </div>
              </div>
            </div>
            <button className="bg-[#1e4a73] hover:bg-[#163a5f] px-4 py-2 rounded-lg flex items-center space-x-2">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4">
        {/* Exercise List */}
        {exercises.map((exercise) => (
          <div key={exercise.id} className="bg-white rounded-lg shadow-sm">
            {/* Exercise Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">≡</span>
                  </div>
                  <span className="font-semibold text-gray-900">{exercise.sets} SETS</span>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded">
                  <MoreHorizontal className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Exercise Details */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium text-white ${exercise.categoryColor}`}>
                    {exercise.category}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    INFO
                  </span>
                </div>
                <button className="text-[#2a5d90] text-sm hover:underline">
                  PAST LOGS
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-600">A</span>
                  </div>
                  <select className="border border-gray-300 rounded px-3 py-2 text-sm">
                    <option>{exercise.name}</option>
                  </select>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <span className="text-sm">▼</span>
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Reps: {exercise.reps}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Rest: {exercise.rest}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}

export default WorkoutDay
