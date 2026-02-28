'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomReferralCodeDialogProps {
  onCreateCode: (customCode: string, maxUses: number | null, pointsPerReferral: number, expiresAt: string | null) => Promise<void>
  isCreating: boolean
}

interface ValidationResult {
  isValid: boolean
  error: string | null
  suggestions: string[] | null
}

export default function CustomReferralCodeDialog({ onCreateCode, isCreating }: CustomReferralCodeDialogProps) {
  const [open, setOpen] = useState(false)
  const [customCode, setCustomCode] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [pointsPerReferral, setPointsPerReferral] = useState('100')
  const [expiresAt, setExpiresAt] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState('')

  const validateCode = async (code: string) => {
    if (!code || code.length < 4) {
      setValidation(null)
      return
    }

    try {
      setValidating(true)
      const response = await fetch('/api/referrals/validate-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customCode: code })
      })

      const result = await response.json()
      setValidation(result)
    } catch (err) {
      setValidation({ isValid: false, error: 'Failed to validate code', suggestions: null })
    } finally {
      setValidating(false)
    }
  }

  const handleCodeChange = (value: string) => {
    // Keep original case, just remove any invalid characters if needed
    const cleanValue = value.replace(/[^a-zA-Z0-9_-]/g, '')
    setCustomCode(cleanValue)
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      validateCode(cleanValue)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  const handleSubmit = async () => {
    if (!validation?.isValid) {
      setError('Please enter a valid custom referral code')
      return
    }

    try {
      setError('')
      await onCreateCode(
        customCode,
        maxUses ? parseInt(maxUses) : null,
        parseInt(pointsPerReferral),
        expiresAt || null
      )
      
      // Reset form
      setCustomCode('')
      setMaxUses('')
      setPointsPerReferral('100')
      setExpiresAt('')
      setValidation(null)
      setOpen(false)
    } catch (err) {
      setError('Failed to create custom referral code')
    }
  }

  const selectSuggestion = (suggestion: string) => {
    setCustomCode(suggestion)
    validateCode(suggestion)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Create Custom Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Custom Referral Code</DialogTitle>
          <DialogDescription>
            Create your own personalized referral code. Choose something memorable and unique!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Custom Code Input */}
          <div className="space-y-2">
            <Label htmlFor="customCode">Custom Referral Code</Label>
            <div className="relative">
              <Input
                id="customCode"
                value={customCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="e.g., mycode2024"
                className={cn(
                  "pr-10",
                  validation?.isValid && "border-green-500",
                  validation?.error && !validation?.isValid && "border-red-500"
                )}
                maxLength={50}
              />
              {validating && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {!validating && validation?.isValid && (
                <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
              )}
              {!validating && validation?.error && !validation?.isValid && (
                <XCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
              )}
            </div>
            
            {/* Validation Messages */}
            {validation?.error && (
              <Alert variant="destructive">
                <AlertDescription>{validation.error}</AlertDescription>
              </Alert>
            )}

            {/* Suggestions */}
            {validation?.suggestions && validation.suggestions.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Suggestions:</Label>
                <div className="flex flex-wrap gap-2">
                  {validation.suggestions.map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Code Requirements */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Requirements:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>At least 4 characters long</li>
                <li>Maximum 50 characters</li>
                <li>Any characters allowed</li>
              </ul>
            </div>
          </div>

          {/* Max Uses */}
          <div className="space-y-2">
            <Label htmlFor="maxUses">Maximum Uses (optional)</Label>
            <Input
              id="maxUses"
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Leave empty for unlimited"
              min="1"
              max="1000"
            />
          </div>

          {/* Points Per Referral */}
          <div className="space-y-2">
            <Label htmlFor="pointsPerReferral">Points Per Referral</Label>
            <Input
              id="pointsPerReferral"
              type="number"
              value={pointsPerReferral}
              onChange={(e) => setPointsPerReferral(e.target.value)}
              min="1"
              max="10000"
            />
          </div>

          {/* Expiration Date */}
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!validation?.isValid || isCreating}
              className="gap-2"
            >
              {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Code
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
