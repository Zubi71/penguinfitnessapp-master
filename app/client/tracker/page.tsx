"use client"
import React, { useState, useEffect } from 'react'
import { ArrowLeft, Plus, MoreHorizontal, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface WeightEntry {
  id: string
  weight: number
  date: string
  notes?: string
  change?: number
}

export default function ClientWeightTracker() {
  const [selectedPeriod, setSelectedPeriod] = useState('1M')
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [weightData, setWeightData] = useState<WeightEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newWeight, setNewWeight] = useState({
    weight: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [stats, setStats] = useState({
    weeklyAverage: 0,
    weeklyChange: 0,
    monthlyChange: 0
  })

  const router = useRouter()
  const periods = ['1M', '3M', '6M']

  // Get period start date
  const getPeriodStartDate = (period: string): string => {
    const now = new Date()
    const startDate = new Date(now)
    
    switch (period) {
      case '1M':
        startDate.setMonth(now.getMonth() - 1)
        break
      case '3M':
        startDate.setMonth(now.getMonth() - 3)
        break
      case '6M':
        startDate.setMonth(now.getMonth() - 6)
        break
    }
    
    return startDate.toISOString().split('T')[0]
  }

  // Fetch weight data from database
  const fetchWeightData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const startDate = getPeriodStartDate(selectedPeriod)
      
      const response = await fetch(`/api/weight-tracker/client-data?startDate=${startDate}&endDate=${endDate}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch weight data')
      }
      
      const data = await response.json()
      
      // Calculate changes between consecutive entries
      const sortedData = (data.weightData || []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      const dataWithChanges: WeightEntry[] = sortedData.map((entry: any, index: number) => {
        let change = 0
        if (index > 0) {
          change = entry.weight - sortedData[index - 1].weight
        }
        return {
          id: entry.id,
          weight: entry.weight,
          date: entry.date,
          notes: entry.notes,
          change: Number(change.toFixed(2))
        }
      }).reverse() // Most recent first

      setWeightData(dataWithChanges)
      calculateStats(dataWithChanges)
    } catch (error) {
      console.error('Error in fetchWeightData:', error)
      setError('Failed to load weight data')
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const calculateStats = (data: WeightEntry[]) => {
    if (data.length === 0) {
      setStats({ weeklyAverage: 0, weeklyChange: 0, monthlyChange: 0 })
      return
    }

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Weekly data
    const weeklyData = data.filter(entry => new Date(entry.date) >= oneWeekAgo)
    const weeklyAverage = weeklyData.length > 0 
      ? weeklyData.reduce((sum, entry) => sum + entry.weight, 0) / weeklyData.length 
      : 0

    // Weekly change (difference between most recent and week ago)
    const weeklyChange = weeklyData.length >= 2 
      ? weeklyData[0].weight - weeklyData[weeklyData.length - 1].weight 
      : 0

    // Monthly change
    const monthlyData = data.filter(entry => new Date(entry.date) >= oneMonthAgo)
    const monthlyChange = monthlyData.length >= 2 
      ? monthlyData[0].weight - monthlyData[monthlyData.length - 1].weight 
      : 0

    setStats({
      weeklyAverage: Number(weeklyAverage.toFixed(1)),
      weeklyChange: Number(weeklyChange.toFixed(1)),
      monthlyChange: Number(monthlyChange.toFixed(1))
    })
  }

  // Add new weight entry
  const handleAddWeight = async () => {
    try {
      if (!newWeight.weight || isNaN(Number(newWeight.weight))) {
        alert('Please enter a valid weight')
        return
      }

      const response = await fetch('/api/weight-tracker/add-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight: Number(newWeight.weight),
          date: newWeight.date,
          notes: newWeight.notes || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 409) {
          alert('Weight entry for this date already exists. Please choose a different date.')
        } else {
          throw new Error(errorData.error || 'Failed to add weight entry')
        }
        return
      }

      setShowAddModal(false)
      setNewWeight({
        weight: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      
      // Refresh data
      fetchWeightData()
    } catch (error) {
      console.error('Error in handleAddWeight:', error)
      setError('Failed to add weight entry')
    }
  }

  useEffect(() => {
    fetchWeightData()
  }, [selectedPeriod, endDate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5d90] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading weight data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button 
            onClick={fetchWeightData}
            className="bg-[#2a5d90] text-white px-4 py-2 rounded hover:bg-[#1e4a73]"
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
        <div className="bg-[#2a5d90] text-white p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-[#1e4a73] rounded-lg">
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-2xl font-bold">Body Weight Tracker</h1>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-[#1e4a73] rounded">
                  <MoreHorizontal className="h-6 w-6" />
                </button>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-[#1e4a73] hover:bg-[#16405e] p-2 rounded"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">BODY WEIGHT</h2>
              <div className="flex items-center space-x-2">
                <button className="p-2 hover:bg-gray-100 rounded">
                  <MoreHorizontal className="h-5 w-5 text-gray-400" />
                </button>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-[#2a5d90] hover:bg-[#1e4a73] text-white p-2 rounded"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Date and Target Section */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">End Date:</span>
                <div className="flex items-center space-x-2 border border-gray-300 rounded px-3 py-2">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-none outline-none"
                  />
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              {/* <button className="border border-[#2a5d90] text-[#2a5d90] px-4 py-2 rounded hover:bg-blue-50">
                Set Target
              </button> */}
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Weekly Average</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.weeklyAverage > 0 ? stats.weeklyAverage : '-'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-sm">Weekly Change</p>
                <p className={`text-3xl font-bold flex items-center justify-center ${
                  stats.weeklyChange > 0 ? 'text-green-600' : 
                  stats.weeklyChange < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {stats.weeklyChange > 0 && <TrendingUp className="h-6 w-6 mr-1" />}
                  {stats.weeklyChange < 0 && <TrendingDown className="h-6 w-6 mr-1" />}
                  {stats.weeklyChange === 0 && <Minus className="h-6 w-6 mr-1" />}
                  {stats.weeklyChange !== 0 ? (stats.weeklyChange > 0 ? '+' : '') + stats.weeklyChange : '0.0'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-500 text-sm">Monthly Change</p>
                <p className={`text-3xl font-bold flex items-center justify-center ${
                  stats.monthlyChange > 0 ? 'text-green-600' : 
                  stats.monthlyChange < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {stats.monthlyChange > 0 && <TrendingUp className="h-6 w-6 mr-1" />}
                  {stats.monthlyChange < 0 && <TrendingDown className="h-6 w-6 mr-1" />}
                  {stats.monthlyChange === 0 && <Minus className="h-6 w-6 mr-1" />}
                  {stats.monthlyChange !== 0 ? (stats.monthlyChange > 0 ? '+' : '') + stats.monthlyChange : '0.0'}
                </p>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="mb-6">
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">Weight Chart</p>
                  {weightData.length > 0 ? (
                    <div className="w-full h-32 relative">
                      {/* Simple chart representation */}
                      <svg className="w-full h-full" viewBox="0 0 400 120">
                        <polyline
                          points={weightData.slice(-7).reverse().map((entry, index) => {
                            const x = 50 + (index * 50)
                            const maxWeight = Math.max(...weightData.slice(-7).map(e => e.weight))
                            const minWeight = Math.min(...weightData.slice(-7).map(e => e.weight))
                            const range = maxWeight - minWeight || 1
                            const y = 100 - ((entry.weight - minWeight) / range) * 60
                            return `${x},${y}`
                          }).join(' ')}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2"
                        />
                        {/* Data points */}
                        {weightData.slice(-7).reverse().map((entry, index) => {
                          const x = 50 + (index * 50)
                          const maxWeight = Math.max(...weightData.slice(-7).map(e => e.weight))
                          const minWeight = Math.min(...weightData.slice(-7).map(e => e.weight))
                          const range = maxWeight - minWeight || 1
                          const y = 100 - ((entry.weight - minWeight) / range) * 60
                          return (
                            <circle key={entry.id} cx={x} cy={y} r="3" fill="#ef4444" />
                          )
                        })}
                      </svg>
                    </div>
                  ) : (
                    <p className="text-gray-400">No weight data available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Period Selector */}
            <div className="flex justify-center space-x-1 mb-6">
              {periods.map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-6 py-2 rounded ${
                    selectedPeriod === period
                      ? 'bg-[#2a5d90] text-white'
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* Weight Log Table */}
            <div className="space-y-2">
              {weightData.length > 0 ? (
                weightData.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">
                      {new Date(entry.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                    <span className="font-semibold text-gray-900">{entry.weight} kg</span>
                    <span className={`font-semibold ${
                      (entry.change || 0) > 0 ? 'text-green-600' : 
                      (entry.change || 0) < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {(entry.change || 0) > 0 ? '+' : ''}{entry.change || '0.0'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No weight entries found</p>
                  <p className="text-sm text-gray-400 mt-2">Add your first weight entry to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Weight Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Weight Entry</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight.weight}
                    onChange={(e) => setNewWeight({ ...newWeight, weight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a5d90]"
                    placeholder="e.g., 70.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newWeight.date}
                    onChange={(e) => setNewWeight({ ...newWeight, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a5d90]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={newWeight.notes}
                    onChange={(e) => setNewWeight({ ...newWeight, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a5d90]"
                    rows={3}
                    placeholder="Any notes about this measurement..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWeight}
                  className="px-4 py-2 bg-[#2a5d90] text-white rounded-lg hover:bg-[#1e4a73]"
                >
                  Add Weight
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
