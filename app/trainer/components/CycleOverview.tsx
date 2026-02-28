import React, { useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'

interface CycleOverviewProps {
  cycle: any
  onSelectDay: (day: any) => void
  onBack: () => void
}

const CycleOverview: React.FC<CycleOverviewProps> = ({ cycle, onSelectDay, onBack }) => {
  const [weeks] = useState([
    { id: 1, name: 'Week 1', completed: false },
    { id: 2, name: 'Week 2', completed: false },
    { id: 3, name: 'Week 3', completed: false },
    { id: 4, name: 'Week 4', completed: false },
    { id: 5, name: 'Week 5', completed: false },
    { id: 6, name: 'Week 6', completed: false },
    { id: 7, name: 'Week 7', completed: false },
    { id: 8, name: 'Week 8', completed: false }
  ])

  const [isCompleted, setIsCompleted] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-4xl">
        <div className="bg-[#2a5d90] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={onBack} className="p-2 hover:bg-[#1e4a73] rounded-lg">
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <p className="text-blue-200 text-sm">CYCLE</p>
                <h1 className="text-2xl font-bold">{cycle?.name || '8 Weeks Recomp'}</h1>
              </div>
            </div>
            <button className="bg-[#2a5d90] hover:bg-[#1e4a73] px-4 py-2 rounded-lg flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Week</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Week Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-3">
            {weeks.map((week) => (
              <button
                key={week.id}
                onClick={() => onSelectDay({ week: week.id, name: week.name })}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{week.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Finish Cycle Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-[#2a5d90] mb-4">FINISH CYCLE</h3>
            <div className="flex items-center justify-center space-x-3">
              <input
                type="checkbox"
                id="complete-cycle"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                className="w-4 h-4 text-[#2a5d90] border-gray-300 rounded focus:ring-[#2a5d90]"
              />
              <label htmlFor="complete-cycle" className="text-gray-700">
                Mark cycle as complete
              </label>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

export default CycleOverview
