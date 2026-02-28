'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface UtilizationData {
  hour: string
  utilization: number
  classes: number
}

interface Props {
  data: UtilizationData[]
  isLoading?: boolean
}

export default function ClassUtilizationHeatmap({ data, isLoading = false }: Props) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  // Use empty array if no data to show empty chart instead of message
  const chartData = data && data.length > 0 ? data : []

  // Color function based on utilization
  const getColor = (utilization: number) => {
    if (utilization >= 80) return '#10b981' // green
    if (utilization >= 60) return '#3b82f6' // blue
    if (utilization >= 40) return '#f59e0b' // orange
    return '#ef4444' // red
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="hour" 
            stroke="#64748b"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value.toFixed(1)}% (${props.payload.classes} classes)`,
              'Utilization'
            ]}
          />
          <Bar 
            dataKey="utilization" 
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`}
                fill={getColor(entry.utilization)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

