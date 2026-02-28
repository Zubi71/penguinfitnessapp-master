'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  averageHours: number
  isLoading?: boolean
}

export default function CancellationByTimeChart({ averageHours, isLoading = false }: Props) {
  if (isLoading) {
    return <Skeleton className="h-64 w-full" />
  }

  const days = averageHours / 24
  const hours = averageHours % 24

  return (
    <div className="h-64 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl font-bold text-slate-900 mb-2">
          {days > 0 ? `${days.toFixed(1)} days` : `${hours.toFixed(1)} hours`}
        </div>
        <p className="text-sm text-slate-600">
          Average time before class when cancellations occur
        </p>
        {averageHours < 24 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ Most cancellations occur less than 24 hours before class
            </p>
          </div>
        )}
      </div>
    </div>
  )
}






