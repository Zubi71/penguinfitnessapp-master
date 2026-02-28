'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface HotspotData {
  [key: string]: string | number
  cancellationRate: number
  total: number
  cancelled: number
}

interface Props {
  data: HotspotData[]
  dataKey: string
  labelKey: string
  isLoading?: boolean
  layout?: 'vertical' | 'horizontal'
}

export default function CancellationHotspotChart({ 
  data, 
  dataKey, 
  labelKey, 
  isLoading = false,
  layout = 'vertical'
}: Props) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  // Use empty array if no data to show empty chart instead of message
  const chartData = data && data.length > 0 ? data : []

  // Color function based on cancellation rate
  const getColor = (rate: number) => {
    if (rate >= 30) return '#ef4444' // red - high
    if (rate >= 20) return '#f59e0b' // orange - medium-high
    if (rate >= 10) return '#eab308' // yellow - medium
    return '#10b981' // green - low
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout={layout}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            type="number"
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            label={{ value: 'Cancellation Rate (%)', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            type="category"
            dataKey={dataKey}
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            width={100}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value: number, name: string, props: any) => [
              `${value.toFixed(1)}% (${props.payload.cancelled} of ${props.payload.total})`,
              'Cancellation Rate'
            ]}
          />
          <Bar 
            dataKey="cancellationRate" 
            radius={layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.cancellationRate as number)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

