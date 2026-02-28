'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Calendar, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'

interface PaymentData {
  sessionId: string
  invoiceId: string
  invoiceNumber: string
  amount: number
  eventTitle?: string
  eventDate?: string
  eventTime?: string
  eventLocation?: string
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionId) {
      fetchPaymentDetails()
    }
  }, [sessionId])

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/stripe/payment-success?session_id=${sessionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment details')
      }

      const data = await response.json()
      setPaymentData(data)
    } catch (error) {
      console.error('Error fetching payment details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5d90]"></div>
      </div>
    )
  }

  if (!paymentData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Found</h1>
          <p className="text-gray-600">Unable to retrieve payment details.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600">Thank you for your payment. Your registration has been confirmed.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Payment Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Invoice Number:</span>
              <span className="font-medium">{paymentData.invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-semibold text-green-600">${paymentData.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Payment Status:</span>
              <Badge className="bg-green-100 text-green-800">Paid</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {paymentData.eventTitle && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{paymentData.eventTitle}</span>
              </div>
              {paymentData.eventDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {new Date(paymentData.eventDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {paymentData.eventTime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{paymentData.eventTime}</span>
                </div>
              )}
              {paymentData.eventLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{paymentData.eventLocation}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-800 font-semibold mb-2">What's Next?</h3>
          <p className="text-blue-700 text-sm">
            You will receive a confirmation email shortly. Please check your email for event details and any additional instructions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/client/community-events">
            <Button variant="outline">
              View My Events
            </Button>
          </Link>
          <Link href="/client">
            <Button>
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5d90]"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
