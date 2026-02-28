'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface RevenueData {
  date: string
  revenue: number
}

interface Props {
  data: RevenueData[]
  isLoading?: boolean
}

export default function RevenueTrendChart({ data, isLoading = false }: Props) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  // Use empty array if no data to show empty chart instead of message
  const chartData = data && data.length > 0 ? data : []

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
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
            label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke="#6366f1" 
            fillOpacity={1}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

