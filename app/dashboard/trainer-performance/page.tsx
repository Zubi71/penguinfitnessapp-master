'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Star,
  RefreshCw,
  BarChart3
} from 'lucide-react'

interface TrainerPerformance {
  trainer_id: string
  measurement_period_start: string
  measurement_period_end: string
  total_classes: number
  completed_classes: number
  cancelled_classes: number
  cancellation_rate: number
  average_attendance_rate: number
  client_satisfaction_score: number | null
  replacement_success_rate: number | null
  emergency_sop_responses: number
  revenue_generated: number
  trainer?: {
    email: string
    raw_user_meta_data?: {
      first_name?: string
      last_name?: string
    }
  }
}

export default function TrainerPerformanceDashboard() {
  const [metrics, setMetrics] = useState<TrainerPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState('30')
  const [selectedTrainer, setSelectedTrainer] = useState<string>('all')

  useEffect(() => {
    loadMetrics()
  }, [days, selectedTrainer])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const url = selectedTrainer === 'all'
        ? `/api/insights/trainer-performance?days=${days}`
        : `/api/insights/trainer-performance?days=${days}&trainer_id=${selectedTrainer}`
      
      const response = await fetch(url, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics || [])
      }
    } catch (error) {
      console.error('Error loading trainer performance:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrainerName = (trainer: TrainerPerformance) => {
    if (trainer.trainer?.raw_user_meta_data?.first_name) {
      return `${trainer.trainer.raw_user_meta_data.first_name} ${trainer.trainer.raw_user_meta_data.last_name || ''}`.trim()
    }
    return trainer.trainer?.email || 'Unknown Trainer'
  }

  const getPerformanceColor = (rate: number, isPositive: boolean) => {
    if (isPositive) {
      if (rate >= 80) return 'text-green-600'
      if (rate >= 60) return 'text-yellow-600'
      return 'text-red-600'
    } else {
      if (rate <= 10) return 'text-green-600'
      if (rate <= 20) return 'text-yellow-600'
      return 'text-red-600'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Trainer Performance Metrics</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Comprehensive performance tracking and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={days} onValueChange={setDays}>
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
          <Button onClick={loadMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Trainers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Cancellation Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics.reduce((sum, m) => sum + m.cancellation_rate, 0) / metrics.length).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(metrics.reduce((sum, m) => sum + m.average_attendance_rate, 0) / metrics.length).toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.reduce((sum, m) => sum + m.revenue_generated, 0).toFixed(0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trainer Performance Cards */}
      {metrics.length > 0 ? (
        <div className="space-y-4">
          {metrics.map((trainer, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{getTrainerName(trainer)}</CardTitle>
                    <CardDescription>
                      Period: {new Date(trainer.measurement_period_start).toLocaleDateString()} - {new Date(trainer.measurement_period_end).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {trainer.client_satisfaction_score && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {(trainer.client_satisfaction_score * 5).toFixed(1)}/5
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Total Classes</p>
                    <p className="text-xl font-semibold">{trainer.total_classes}</p>
                    <p className="text-xs text-slate-400">
                      {trainer.completed_classes} completed
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 mb-1">Cancellation Rate</p>
                    <p className={`text-xl font-semibold ${getPerformanceColor(trainer.cancellation_rate, false)}`}>
                      {trainer.cancellation_rate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-400">
                      {trainer.cancelled_classes} cancelled
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 mb-1">Attendance Rate</p>
                    <p className={`text-xl font-semibold ${getPerformanceColor(trainer.average_attendance_rate, true)}`}>
                      {trainer.average_attendance_rate.toFixed(1)}%
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 mb-1">Revenue Generated</p>
                    <p className="text-xl font-semibold text-green-600">
                      ${trainer.revenue_generated.toFixed(0)}
                    </p>
                  </div>
                </div>

                {trainer.emergency_sop_responses > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-slate-500">
                      Emergency SOP Responses: <span className="font-semibold">{trainer.emergency_sop_responses}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500 text-center py-4">
              No trainer performance data available for the selected period
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

