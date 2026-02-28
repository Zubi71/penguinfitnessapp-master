'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface EnrollmentData {
  date: string
  enrollments: number
}

interface Props {
  data: EnrollmentData[]
  isLoading?: boolean
}

export default function EnrollmentTrendChart({ data, isLoading = false }: Props) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  // Use empty array if no data to show empty chart instead of message
  const chartData = data && data.length > 0 ? data : []

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#64748b"
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value: number) => [value, 'New Enrollments']}
          />
          <Bar 
            dataKey="enrollments" 
            fill="url(#enrollmentGradient)" 
            radius={[4, 4, 0, 0]}
          />
          <defs>
            <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

