'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  DollarSign,
  Users,
  Activity,
  RefreshCw,
  MessageSquare
} from 'lucide-react'

interface AtRiskClient {
  id: string
  client_id: string
  risk_level: string
  days_inactive: number
  revenue_at_risk: number
  risk_factors: any
  client: {
    first_name: string
    last_name: string
    email: string
  }
}

interface CancellationAnalytics {
  total_cancellations: number
  period_days: number
  by_category: Array<{
    category: string
    count: number
    percentage: number
    average_hours_before: number | null
  }>
}

interface RevenueLeakage {
  summary: {
    total_lost: number
    total_recovered: number
    net_loss: number
    recovery_rate: number
  }
  by_type: Record<string, { count: number; total: number }>
}

interface FeedbackAnalysis {
  total_feedback: number
  by_sentiment: {
    positive: number
    neutral: number
    negative: number
  }
  average_rating: number
  recent_feedback: Array<{
    id: string
    rating: number
    text_feedback: string
    ai_sentiment: string
    created_at: string
  }>
}

export default function ImpactFeedbackDashboard() {
  const [atRiskClients, setAtRiskClients] = useState<AtRiskClient[]>([])
  const [cancellationAnalytics, setCancellationAnalytics] = useState<CancellationAnalytics | null>(null)
  const [revenueLeakage, setRevenueLeakage] = useState<RevenueLeakage | null>(null)
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<FeedbackAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('at-risk')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadAtRiskClients(),
        loadCancellationAnalytics(),
        loadRevenueLeakage(),
        loadFeedbackAnalysis()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAtRiskClients = async () => {
    try {
      const response = await fetch('/api/insights/at-risk-clients?active_only=true', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setAtRiskClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error loading at-risk clients:', error)
    }
  }

  const loadCancellationAnalytics = async () => {
    try {
      const response = await fetch('/api/events/cancellation-reason?days=30', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCancellationAnalytics(data)
      }
    } catch (error) {
      console.error('Error loading cancellation analytics:', error)
    }
  }

  const loadRevenueLeakage = async () => {
    try {
      const response = await fetch('/api/insights/revenue-leakage?days=30&include_recovered=false', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setRevenueLeakage(data)
      }
    } catch (error) {
      console.error('Error loading revenue leakage:', error)
    }
  }

  const loadFeedbackAnalysis = async () => {
    try {
      const response = await fetch('/api/insights/feedback-analysis?days=30', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setFeedbackAnalysis(data)
      }
    } catch (error) {
      console.error('Error loading feedback analysis:', error)
    }
  }

  const triggerAtRiskDetection = async () => {
    try {
      const response = await fetch('/api/insights/at-risk-clients/detect', {
        method: 'POST',
        credentials: 'include'
      })
      if (response.ok) {
        await loadAtRiskClients()
      }
    } catch (error) {
      console.error('Error triggering detection:', error)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
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

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Impact & Feedback Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">
            Core metrics and analytics
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="at-risk">At-Risk Clients</TabsTrigger>
          <TabsTrigger value="cancellations">Cancellations</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Leakage</TabsTrigger>
          <TabsTrigger value="feedback">Feedback Analysis</TabsTrigger>
        </TabsList>

        {/* At-Risk Clients Tab */}
        <TabsContent value="at-risk" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">At-Risk Clients</h2>
            <Button onClick={triggerAtRiskDetection} variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Run Detection
            </Button>
          </div>

          {atRiskClients.length > 0 ? (
            <div className="space-y-3">
              {atRiskClients.map((client) => (
                <Card key={client.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">
                          {client.client?.first_name} {client.client?.last_name}
                        </h3>
                        <p className="text-sm text-slate-600">{client.client?.email}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge className={getRiskLevelColor(client.risk_level)}>
                            {client.risk_level}
                          </Badge>
                          <Badge variant="outline">
                            {client.days_inactive} days inactive
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Revenue at Risk</p>
                        <p className="text-lg font-bold text-red-600">
                          ${(typeof client.revenue_at_risk === 'number' 
                            ? client.revenue_at_risk 
                            : parseFloat(String(client.revenue_at_risk || '0'))).toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500 text-center py-4">
                  No at-risk clients detected
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cancellations Tab */}
        <TabsContent value="cancellations" className="space-y-4">
          <h2 className="text-xl font-semibold">Cancellation Analysis</h2>
          {cancellationAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Cancellations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{cancellationAnalytics.total_cancellations}</div>
                  <p className="text-sm text-slate-500 mt-1">
                    Last {cancellationAnalytics.period_days} days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>By Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cancellationAnalytics.by_category.map((cat, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-sm">{cat.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{cat.count}</span>
                          <span className="text-xs text-slate-500">({cat.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Revenue Leakage Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <h2 className="text-xl font-semibold">Revenue Leakage Analysis</h2>
          {revenueLeakage && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Lost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      ${revenueLeakage.summary.total_lost.toFixed(0)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recovered</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ${revenueLeakage.summary.total_recovered.toFixed(0)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {revenueLeakage.summary.recovery_rate.toFixed(1)}% recovery rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Net Loss</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${revenueLeakage.summary.net_loss.toFixed(0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>By Leakage Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(revenueLeakage.by_type).map(([type, data]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm">{type.replace(/_/g, ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">${data.total.toFixed(0)}</span>
                          <span className="text-xs text-slate-500">({data.count} cases)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Feedback Analysis Tab */}
        <TabsContent value="feedback" className="space-y-4">
          <h2 className="text-xl font-semibold">Feedback Analysis</h2>
          {feedbackAnalysis ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{feedbackAnalysis.total_feedback}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Average Rating</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {feedbackAnalysis.average_rating.toFixed(1)}/5
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-green-600">Positive</span>
                        <span className="text-sm font-semibold">{feedbackAnalysis.by_sentiment.positive}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Neutral</span>
                        <span className="text-sm font-semibold">{feedbackAnalysis.by_sentiment.neutral}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-red-600">Negative</span>
                        <span className="text-sm font-semibold">{feedbackAnalysis.by_sentiment.negative}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {feedbackAnalysis.recent_feedback.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {feedbackAnalysis.recent_feedback.map((fb) => (
                        <div key={fb.id} className="border-l-4 pl-4 py-2" style={{
                          borderColor: fb.ai_sentiment === 'positive' ? '#10b981' : 
                                      fb.ai_sentiment === 'negative' ? '#ef4444' : '#6b7280'
                        }}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{fb.rating}/5</span>
                                <Badge variant="outline" className="text-xs">
                                  {fb.ai_sentiment}
                                </Badge>
                              </div>
                              {fb.text_feedback && (
                                <p className="text-sm text-slate-600">{fb.text_feedback}</p>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">
                              {new Date(fb.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500 text-center py-4">
                  No feedback data available
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
