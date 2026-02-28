"use client"
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Key, CheckCircle, AlertCircle, Copy } from 'lucide-react'

interface AdminPasswordResetProps {
  userId: string
  userEmail: string
  userName: string
}

export default function AdminPasswordReset({ userId, userEmail, userName }: AdminPasswordResetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [resetLink, setResetLink] = useState('')

  const handleAdminReset = async () => {
    setIsLoading(true)
    setError('')
    setMessage('')
    setResetLink('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include cookies for authentication
        body: JSON.stringify({
          email: userEmail,
          userId: userId,
          isAdminReset: true
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate password reset')
      }

      setMessage(`Password reset email sent to ${userEmail}`)
      
      // In development, show the reset link
      if (data.resetLink && process.env.NODE_ENV === 'development') {
        setResetLink(data.resetLink)
      }
      
    } catch (err: any) {
      console.error('Admin password reset error:', err)
      setError(err.message || 'Failed to initiate password reset')
    } finally {
      setIsLoading(false)
    }
  }

  const copyResetLink = () => {
    if (resetLink) {
      navigator.clipboard.writeText(resetLink)
      alert('Reset link copied to clipboard!')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
        >
          <Key className="w-4 h-4 mr-1" />
          Reset Password
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-orange-600" />
            Reset User Password
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>User</Label>
            <div className="p-3 bg-slate-50 rounded-md">
              <p className="font-medium">{userName}</p>
              <p className="text-sm text-slate-600">{userEmail}</p>
            </div>
          </div>

          <p className="text-sm text-slate-600">
            This will send a password reset email to the user. They will receive a secure link 
            to create a new password.
          </p>

          {resetLink && (
            <div className="space-y-2">
              <Label>Reset Link (Development Only)</Label>
              <div className="flex gap-2">
                <Input 
                  value={resetLink} 
                  readOnly 
                  className="text-xs"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={copyResetLink}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-amber-600">
                ⚠️ This link is only shown in development mode for testing purposes.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleAdminReset}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Sending...' : 'Send Reset Email'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
