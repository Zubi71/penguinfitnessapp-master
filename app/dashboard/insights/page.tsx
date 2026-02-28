'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  AlertTriangle, 
  Calendar,
  Users,
  DollarSign,
  Activity
} from 'lucide-react'

// Import chart components (we'll create these next)
// import AttendanceTrendChart from '@/components/dashboard/insights/AttendanceTrendChart'
// import EnrollmentTrendChart from '@/components/dashboard/insights/EnrollmentTrendChart'
// import RevenueTrendChart from '@/components/dashboard/insights/RevenueTrendChart'
// import ClassUtilizationHeatmap from '@/components/dashboard/insights/ClassUtilizationHeatmap'
// import CancellationHotspotChart from '@/components/dashboard/insights/CancellationHotspotChart'
// import CancellationByTimeChart from '@/components/dashboard/insights/CancellationByTimeChart'
import TrainerPerformanceCard from '@/components/dashboard/insights/TrainerPerformanceCard'
import InsightsRecommendations from '@/components/dashboard/insights/InsightsRecommendations'

interface InsightsData {
  operationalTrends: {
    attendance: {
      daily: Array<{ date: string; attendance: number; present: number; total: number }>
      averageRate: number
    }
    enrollment: {
      daily: Array<{ date: string; enrollments: number }>
      total: number
      active: number
      cancelled: number
    }
    revenue: {
      daily: Array<{ date: string; revenue: number }>
      total: number
      averageDaily: number
    }
    classUtilization: {
      byHour: Array<{ hour: string; utilization: number; classes: number }>
      averageOccupancy: number
    }
    trainerPerformance: Array<{
      name: string
      classes: number
      cancellations: number
      cancellationRate: number
      attendanceRate: number
    }>
  }
  cancellationHotspots: {
    byTimeOfDay: Array<{ hour: string; cancellationRate: number; total: number; cancelled: number }>
    byDayOfWeek: Array<{ day: string; cancellationRate: number; total: number; cancelled: number }>
    byClassType: Array<{ type: string; cancellationRate: number; total: number; cancelled: number }>
    byTrainer: Array<{ trainer: string; cancellationRate: number; total: number; cancelled: number }>
    byClient: Array<{ clientId: string; cancellations: number }>
    averageHoursBeforeClass: number
  }
  insights: {
    recommendations: string[]
    warnings: string[]
    insights: string[]
  }
  summary: {
    totalClasses: number
    cancelledClasses: number
    totalEnrollments: number
    cancelledEnrollments: number
    overallCancellationRate: number
  }
}

export default function InsightsDashboard() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')

  useEffect(() => {
    fetchInsights()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      // Validate timeRange parameter
      const days = parseInt(timeRange, 10)
      if (isNaN(days) || days < 1 || days > 365) {
        throw new Error('Invalid time range')
      }

      const response = await fetch(`/api/insights?days=${days}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch insights: ${response.status}`)
      }

      const insightsData = await response.json()
      
      // Validate response structure
      if (!insightsData || typeof insightsData !== 'object') {
        throw new Error('Invalid response format')
      }
      
      setData(insightsData)
    } catch (error) {
      console.error('Error fetching insights:', error)
      // Keep data as null to show error state
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6 pb-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load insights data. Please try again.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">AI-Driven Insights Dashboard</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Operational trends and cancellation hotspot analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Overall Cancellation Rate</CardTitle>
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold">
                {data.summary.overallCancellationRate.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {data.summary.cancelledClasses} of {data.summary.totalClasses} classes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Average Attendance</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold">
                {data.operationalTrends.attendance.averageRate.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Over {data.operationalTrends.attendance.daily.length} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold">
                ${data.operationalTrends.revenue.total.toFixed(0)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ${data.operationalTrends.revenue.averageDaily.toFixed(0)}/day avg
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-4 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Class Utilization</CardTitle>
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="text-xl sm:text-2xl font-bold">
                {data.operationalTrends.classUtilization.averageOccupancy.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Average occupancy rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Insights & Recommendations */}
        <InsightsRecommendations 
          recommendations={data.insights.recommendations}
          warnings={data.insights.warnings}
          insights={data.insights.insights}
        />

        {/* Main Content */}
        <div className="space-y-4 pb-4">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Trainer Performance</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Performance metrics by trainer</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 pb-6">
              <div className="space-y-3 sm:space-y-4">
                {data.operationalTrends.trainerPerformance.map((trainer, idx) => (
                  <TrainerPerformanceCard key={idx} trainer={trainer} />
                ))}
                {data.operationalTrends.trainerPerformance.length === 0 && (
                  <p className="text-xs sm:text-sm text-slate-500 text-center py-4">No trainer data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  )
}

