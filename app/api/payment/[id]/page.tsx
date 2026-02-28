'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Calendar, MapPin, Clock, DollarSign, FileText } from 'lucide-react'

interface InvoiceData {
  id: string
  invoice_number: string
  amount: number
  total_amount: number
  currency: string
  status: string
  due_date: string
  description: string
  created_at: string
  client?: {
    first_name: string
    last_name: string
    email: string
  }
}

export default function PaymentPage() {
  const params = useParams()
  const invoiceId = params.id as string
  
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invoices/${invoiceId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoice')
      }

      const data = await response.json()
      setInvoice(data)
    } catch (error) {
      console.error('Error fetching invoice:', error)
      toast.error('Failed to load invoice')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    try {
      setProcessing(true)
      
      // Redirect to Stripe payment page
      const response = await fetch(`/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoiceId,
          amount: invoice?.total_amount,
          description: invoice?.description
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment session')
      }

      const { url } = await response.json()
      
      // Redirect to Stripe checkout
      window.location.href = url
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('Failed to process payment')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5d90]"></div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
          <p className="text-gray-600">The invoice you're looking for doesn't exist or you don't have permission to view it.</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid'
      case 'pending': return 'Pending Payment'
      case 'overdue': return 'Overdue'
      default: return 'Draft'
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment</h1>
        <p className="text-gray-600">Complete your payment to confirm your registration</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Invoice #{invoice.invoice_number}</CardTitle>
              <p className="text-gray-600 mt-1">{invoice.description}</p>
            </div>
            <Badge className={getStatusColor(invoice.status)}>
              {getStatusText(invoice.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">${invoice.amount.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-gray-600">Tax:</span>
              <span className="font-semibold">${(invoice.total_amount - invoice.amount).toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 text-lg font-bold">
              <span>Total:</span>
              <span>${invoice.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice Number:</span>
              <span className="font-medium">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Issue Date:</span>
              <span className="font-medium">
                {new Date(invoice.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Due Date:</span>
              <span className="font-medium">
                {new Date(invoice.due_date).toLocaleDateString()}
              </span>
            </div>
            {invoice.client && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">
                    {invoice.client.first_name} {invoice.client.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium">{invoice.client.email}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {invoice.status === 'pending' && (
        <div className="mt-6 text-center">
          <Button 
            onClick={handlePayment}
            disabled={processing}
            className="w-full max-w-md"
            size="lg"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="h-4 w-4 mr-2" />
                Pay ${invoice.total_amount.toFixed(2)}
              </>
            )}
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            You will be redirected to our secure payment processor
          </p>
        </div>
      )}

      {invoice.status === 'paid' && (
        <div className="mt-6 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-green-800 font-semibold mb-2">Payment Completed</h3>
            <p className="text-green-700 text-sm">
              Thank you for your payment. Your registration has been confirmed.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
