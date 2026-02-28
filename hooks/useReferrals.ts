'use client'

import { useState, useEffect } from 'react'

interface ReferralCode {
  id: string
  code: string
  max_uses: number | null
  current_uses: number
  points_per_referral: number
  is_active: boolean
  expires_at: string | null
  created_at: string
  total_tracked?: number
  successful_referrals?: number
  pending_referrals?: number
  total_points_awarded?: number
}

interface ReferralAnalytics {
  total_referrals: number
  successful_referrals: number
  pending_referrals: number
  total_points_earned: number
  conversion_rate: number
  referral_codes_count: number
  active_codes_count: number
}

interface ReferralTracking {
  id: string
  status: 'pending' | 'completed' | 'cancelled'
  points_awarded: number
  completed_at: string | null
  created_at: string
  referral_codes: {
    code: string
    points_per_referral: number
  }
}

export function useReferrals() {
  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([])
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null)
  const [tracking, setTracking] = useState<ReferralTracking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchReferralCodes = async () => {
    try {
      const response = await fetch('/api/referrals/codes')
      if (response.ok) {
        const data = await response.json()
        setReferralCodes(data.referralCodes)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch referral codes')
      }
    } catch (err) {
      setError('Failed to fetch referral codes')
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/referrals/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      setError('Failed to fetch analytics')
    }
  }

  const fetchTracking = async () => {
    try {
      const response = await fetch('/api/referrals/tracking?type=sent')
      if (response.ok) {
        const data = await response.json()
        setTracking(data.tracking)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch tracking data')
      }
    } catch (err) {
      setError('Failed to fetch tracking data')
    }
  }

  const createReferralCode = async (data: {
    maxUses?: number
    pointsPerReferral?: number
    expiresAt?: string
  }) => {
    try {
      const response = await fetch('/api/referrals/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchReferralCodes()
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to create referral code' }
    }
  }

  const updateReferralCode = async (id: string, data: {
    maxUses?: number
    pointsPerReferral?: number
    isActive?: boolean
    expiresAt?: string
  }) => {
    try {
      const response = await fetch('/api/referrals/codes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      })

      if (response.ok) {
        await fetchReferralCodes()
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to update referral code' }
    }
  }

  const deleteReferralCode = async (id: string) => {
    try {
      const response = await fetch(`/api/referrals/codes?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchReferralCodes()
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to delete referral code' }
    }
  }

  const trackReferral = async (referralCode: string, referredUserId: string) => {
    try {
      const response = await fetch('/api/referrals/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode, referredUserId })
      })

      if (response.ok) {
        await fetchTracking()
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to track referral' }
    }
  }

  const completeReferral = async (referralCode: string, paymentAmount?: number, paymentId?: string) => {
    try {
      const response = await fetch('/api/referrals/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode, paymentAmount, paymentId })
      })

      if (response.ok) {
        await fetchTracking()
        await fetchAnalytics()
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to complete referral' }
    }
  }

  const validateReferralCode = async (code: string) => {
    try {
      const response = await fetch(`/api/referrals/validate?code=${encodeURIComponent(code)}`)
      const data = await response.json()
      return data
    } catch (err) {
      return { valid: false, message: 'Failed to validate referral code' }
    }
  }

  const refreshData = async () => {
    setLoading(true)
    setError('')
    try {
      await Promise.all([
        fetchReferralCodes(),
        fetchAnalytics(),
        fetchTracking()
      ])
    } catch (err) {
      setError('Failed to refresh data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  return {
    referralCodes,
    analytics,
    tracking,
    loading,
    error,
    createReferralCode,
    updateReferralCode,
    deleteReferralCode,
    trackReferral,
    completeReferral,
    validateReferralCode,
    refreshData
  }
}

// Hook for referral code validation
export function useReferralValidation() {
  const [validation, setValidation] = useState<{
    valid: boolean
    message?: string
    referralCode?: any
  } | null>(null)
  const [validating, setValidating] = useState(false)

  const validateCode = async (code: string) => {
    if (!code || code.length < 6) {
      setValidation(null)
      return
    }

    try {
      setValidating(true)
      const response = await fetch(`/api/referrals/validate?code=${encodeURIComponent(code)}`)
      const data = await response.json()
      setValidation(data)
    } catch (error) {
      setValidation({ valid: false, message: 'Failed to validate referral code' })
    } finally {
      setValidating(false)
    }
  }

  return {
    validation,
    validating,
    validateCode
  }
}

// Hook for referral completion
export function useReferralCompletion() {
  const [completing, setCompleting] = useState(false)

  const completeReferral = async (referralCode: string, paymentData?: any) => {
    try {
      setCompleting(true)
      const response = await fetch('/api/referrals/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          referralCode, 
          paymentAmount: paymentData?.amount,
          paymentId: paymentData?.id 
        })
      })

      const data = await response.json()
      return data
    } catch (error) {
      return { success: false, error: 'Failed to complete referral' }
    } finally {
      setCompleting(false)
    }
  }

  return {
    completing,
    completeReferral
  }
}
