'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface AttendanceData {
  date: string
  attendance: number
  present: number
  total: number
}

interface Props {
  data: AttendanceData[]
  isLoading?: boolean
}

export default function AttendanceTrendChart({ data, isLoading = false }: Props) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  // Use empty array if no data to show empty chart instead of message
  const chartData = data && data.length > 0 ? data : []

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
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
            label={{ value: 'Attendance %', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Attendance Rate']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="attendance" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Attendance Rate (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

