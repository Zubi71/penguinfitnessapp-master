'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Gift } from 'lucide-react'

interface ReferralCodeValidation {
  valid: boolean
  message?: string
  referralCode?: {
    id: string
    code: string
    referrerId: string
    pointsPerReferral: number
    maxUses: number | null
    currentUses: number
    isActive: boolean
    expiresAt: string | null
  }
}

interface ReferralCodeInputProps {
  value: string
  onChange: (value: string) => void
  onValidationChange: (isValid: boolean, referralData?: any) => void
  className?: string
}

export default function ReferralCodeInput({ 
  value, 
  onChange, 
  onValidationChange, 
  className 
}: ReferralCodeInputProps) {
  const [validation, setValidation] = useState<ReferralCodeValidation | null>(null)
  const [validating, setValidating] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (value && value.length >= 6) {
      validateReferralCode(value)
    } else {
      setValidation(null)
      onValidationChange(false)
    }
  }, [value])

  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 6) return

    try {
      setValidating(true)
      const response = await fetch(`/api/referrals/validate?code=${encodeURIComponent(code)}`)
      const data = await response.json()

      setValidation(data)
      onValidationChange(data.valid, data.referralCode)
    } catch (error) {
      console.error('Error validating referral code:', error)
      setValidation({ valid: false, message: 'Failed to validate referral code' })
      onValidationChange(false)
    } finally {
      setValidating(false)
    }
  }

  const getValidationIcon = () => {
    if (validating) {
      return <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
    }
    
    if (!validation) return null
    
    if (validation.valid) {
      return <CheckCircle className="w-4 h-4 text-green-600" />
    } else {
      return <XCircle className="w-4 h-4 text-red-600" />
    }
  }

  const getValidationMessage = () => {
    if (validating) return 'Validating referral code...'
    if (!validation) return null
    
    if (validation.valid) {
      return 'Valid referral code! You\'ll earn points when you complete your first purchase.'
    } else {
      return validation.message || 'Invalid referral code'
    }
  }

  const getValidationVariant = () => {
    if (validating) return 'default'
    if (!validation) return 'default'
    return validation.valid ? 'default' : 'destructive'
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        <Label htmlFor="referralCode">Referral Code (Optional)</Label>
        <div className="relative">
          <Input
            id="referralCode"
            type="text"
            placeholder="Enter referral code"
            value={value}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="pr-10"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getValidationIcon()}
          </div>
        </div>
        
        {validation && (
          <Alert variant={getValidationVariant()}>
            <AlertDescription>{getValidationMessage()}</AlertDescription>
          </Alert>
        )}

        {validation?.valid && validation.referralCode && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gift className="w-4 h-4 text-green-600" />
                  Referral Bonus
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Hide' : 'Details'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-green-700 border-green-300">
                  +{validation.referralCode.pointsPerReferral} Points
                </Badge>
                <span className="text-sm text-green-700">
                  Earned on first purchase
                </span>
              </div>
              
              {showDetails && (
                <div className="space-y-2 text-sm text-green-700">
                  <div>Code: <span className="font-mono font-medium">{validation.referralCode.code}</span></div>
                  <div>
                    Uses: {validation.referralCode.currentUses} / {validation.referralCode.maxUses || '∞'}
                  </div>
                  {validation.referralCode.expiresAt && (
                    <div>
                      Expires: {new Date(validation.referralCode.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Hook for using referral codes in forms
export function useReferralCode() {
  const [referralCode, setReferralCode] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [referralData, setReferralData] = useState<any>(null)

  const handleValidationChange = (valid: boolean, data?: any) => {
    setIsValid(valid)
    setReferralData(data)
  }

  return {
    referralCode,
    setReferralCode,
    isValid,
    referralData,
    handleValidationChange
  }
}
