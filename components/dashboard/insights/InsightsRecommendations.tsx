'use client'

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react'

interface Props {
  recommendations: string[]
  warnings: string[]
  insights: string[]
}

export default function InsightsRecommendations({ 
  recommendations, 
  warnings, 
  insights 
}: Props) {
  return (
    <div className="space-y-4 mb-6">
      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertTitle>Key Insights</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {insights.map((insight, idx) => (
                <li key={idx}>{insight}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm text-slate-700">{rec}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {recommendations.length === 0 && warnings.length === 0 && insights.length === 0 && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-slate-500 text-center">
              No insights available for the selected time period. Try selecting a longer time range.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}






