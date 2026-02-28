'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface TrainerPerformance {
  name: string
  classes: number
  cancellations: number
  cancellationRate: number
  attendanceRate: number
}

interface Props {
  trainer: TrainerPerformance
}

export default function TrainerPerformanceCard({ trainer }: Props) {
  const getCancellationBadgeVariant = (rate: number) => {
    if (rate >= 25) return 'destructive'
    if (rate >= 15) return 'secondary'
    return 'default'
  }

  const getAttendanceBadgeVariant = (rate: number) => {
    if (rate >= 85) return 'default'
    if (rate >= 70) return 'secondary'
    return 'destructive'
  }

  return (
    <Card className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base truncate">{trainer.name}</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Classes</p>
              <p className="text-base sm:text-lg font-semibold">{trainer.classes}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Cancelled</p>
              <p className="text-base sm:text-lg font-semibold">{trainer.cancellations}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-row sm:flex-col gap-2 flex-wrap sm:flex-nowrap">
          <Badge 
            variant={getCancellationBadgeVariant(trainer.cancellationRate)}
            className="w-fit text-xs sm:text-sm"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            {trainer.cancellationRate.toFixed(1)}% cancel
          </Badge>
          <Badge 
            variant={getAttendanceBadgeVariant(trainer.attendanceRate)}
            className="w-fit text-xs sm:text-sm"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {trainer.attendanceRate.toFixed(1)}% attend
          </Badge>
        </div>
      </div>
    </Card>
  )
}
