"use client"
import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const [tokenType, setTokenType] = useState('')

  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    console.log('Reset password page loaded')
    console.log('Full URL:', window.location.href)
    console.log('Search params:', Object.fromEntries(searchParams.entries()))
    
    // Extract tokens from URL hash or search params
    const hash = window.location.hash.substring(1)
    const urlParams = new URLSearchParams(hash)
    
    // Check for modern format (access_token and refresh_token)
    let access_token = urlParams.get('access_token') || searchParams.get('access_token')
    let refresh_token = urlParams.get('refresh_token') || searchParams.get('refresh_token')
    
    // Check for different token formats from email template
    const legacyToken = searchParams.get('token')
    const codeToken = searchParams.get('code') // New format: ?code=uuid
    const type = searchParams.get('type') // Check if this is a recovery token
    
    // Check if we're coming from Supabase verification URL
    const isFromSupabaseVerify = window.location.href.includes('supabase.co/auth/v1/verify')
    
    console.log('Token analysis:', {
      access_token: access_token ? access_token.substring(0, 20) + '...' : null,
      refresh_token: refresh_token ? refresh_token.substring(0, 20) + '...' : null,
      legacyToken: legacyToken ? legacyToken.substring(0, 20) + '...' : null,
      codeToken: codeToken ? codeToken.substring(0, 20) + '...' : null,
      type,
      isFromSupabaseVerify
    })
    
    // If we're coming from Supabase verification URL, we need to handle the redirect
    if (isFromSupabaseVerify) {
      console.log('Detected Supabase verification URL - handling redirect')
      // The Supabase verification URL should redirect us to our app with the token
      // If we're still on the Supabase URL, it means the redirect didn't work properly
      setError('Invalid reset link format. Please request a new password reset.')
      return
    }
    
    // If we have a code token, exchange it for session tokens first
    if (codeToken && !access_token) {
      console.log('Code token detected:', codeToken.substring(0, 20) + '...')
      setTokenType('code')
      exchangeCodeForSession(codeToken)
      return
    }
    // If we have a legacy token with type=recovery, treat it as a valid reset token
    else if (legacyToken && type === 'recovery' && !access_token) {
      console.log('Legacy recovery token detected:', legacyToken.substring(0, 20) + '...')
      setAccessToken(legacyToken)
      setRefreshToken('pkce_legacy')
      setTokenType('pkce_legacy')
    }
    // If we have a legacy token without type, still try to use it
    else if (legacyToken && !access_token) {
      console.log('Legacy token detected (no type):', legacyToken.substring(0, 20) + '...')
      setAccessToken(legacyToken)
      setRefreshToken('pkce_legacy')
      setTokenType('pkce_legacy')
    }
    
    const error_description = urlParams.get('error_description') || searchParams.get('error_description')

    if (error_description) {
      setError(decodeURIComponent(error_description))
    } else if (access_token && refresh_token) {
      setAccessToken(access_token)
      setRefreshToken(refresh_token)
      setTokenType('modern')
    }
    // Don't set error if tokens are missing - user might be accessing the page directly
  }, [searchParams])

  // Add this new function to handle code exchange
  const exchangeCodeForSession = async (code: string) => {
    try {
      setIsLoading(true)
      setError('')
      
      console.log('Attempting to exchange code for session...')
      
      const response = await fetch('/api/auth/exchange-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to exchange code')
      }

      // Set the tokens from the exchange
      if (data.access_token && data.refresh_token) {
        console.log('Code exchange successful')
        setAccessToken(data.access_token)
        setRefreshToken(data.refresh_token)
        setTokenType('modern')
      } else {
        throw new Error('Invalid response from code exchange')
      }
    } catch (error) {
      console.error('Code exchange failed:', error)
      setError('Invalid or expired reset link. Please request a new password reset.')
    } finally {
      setIsLoading(false)
    }
  }

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(pwd)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      setError('All fields are required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (!accessToken || !refreshToken) {
      setError('Reset link is invalid or expired. Please request a new password reset.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log('Submitting password reset with token type:', tokenType)
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
          accessToken,
          refreshToken,
          tokenType
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      setIsSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      
    } catch (err: any) {
      console.error('Password reset error:', err)
      setError(err.message || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Password Reset Successful</h1>
            <p className="text-slate-600 mb-6">
              Your password has been updated successfully. You can now sign in with your new password.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Redirecting to login page in 3 seconds...
            </p>
            <Link href="/login">
              <Button className="w-full">
                Continue to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show message if no tokens are available
  if (!accessToken || !refreshToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Reset Link Required
            </CardTitle>
            <p className="text-slate-600 mt-2">
              You need a valid reset link to change your password.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">How to reset your password:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Go to the login page</li>
                <li>Click "Forgot your password?"</li>
                <li>Enter your email address</li>
                <li>Check your email for the reset link</li>
                <li>Click the link in the email to return here</li>
              </ol>
            </div>



            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Link href="/auth/forgot-password">
                <Button className="w-full">
                  Request Password Reset
                </Button>
              </Link>
              
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Set New Password
          </CardTitle>
          <p className="text-slate-600 mt-2">
            Please enter your new password below.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-500" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !accessToken || !refreshToken}
            >
              {isLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>

          <div className="text-center">
            <Link 
              href="/login" 
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
