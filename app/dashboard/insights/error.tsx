'use client'

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function InsightsError({ error, reset }: ErrorProps) {
  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Insights</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">
              {error.message || 'An unexpected error occurred while loading the insights dashboard.'}
            </p>
            <Button onClick={reset} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}

