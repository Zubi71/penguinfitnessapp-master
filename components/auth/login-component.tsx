'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginComponent() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password
        }),
        credentials: 'include', // Important for cookies
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Login failed')
        return
      }

      if (result.success) {
        // Store user info in sessionStorage for client-side access
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('user', JSON.stringify(result.user))
        }
        
        // Successful login - redirect based on user role
        const userRole = result.user?.role
        let redirectTo = '/dashboard' // default
        
        if (userRole === 'client') {
          redirectTo = '/client'
        } else if (userRole === 'trainer') {
          redirectTo = '/trainer'
        } else if (userRole === 'admin') {
          redirectTo = '/dashboard'
        }
        
        router.push(redirectTo)
        router.refresh() // Refresh to update middleware state
      } else {
        setError('Login failed. Please try again.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back! Please sign in to continue.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            {/* Mobile layout: stacked buttons */}
            <div className="flex flex-col gap-2 mt-2 w-full sm:hidden">
              <Link
                href="/register"
                className="flex items-center justify-center w-full py-2 px-3 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm transition-colors"
              >
                <svg className="w-4 h-4 text-blue-500 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                Don't have an account? Register here
              </Link>
              <Link
                href="/auth/forgot-password"
                className="flex items-center justify-center w-full py-2 px-3 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm transition-colors"
              >
                <svg className="w-4 h-4 text-blue-500 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.104.896-2 2-2s2 .896 2 2-.896 2-2 2-2-.896-2-2zm0 0v2m0 4h.01" /></svg>
                Forgot your password?
              </Link>
            </div>
            {/* Desktop layout: horizontal links */}
            <div className="hidden sm:flex flex-row items-center justify-center gap-6 mt-2 w-full">
              <div className='text-sm'>
                <a href="/register" className="text-blue-700 font-semibold hover:underline transition-colors">
                  Don't have an account? Register here
                </a>
              </div>
              <div className='text-sm'>
                <Link href="/auth/forgot-password" className="text-blue-700 font-semibold hover:underline transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </div>
            <div className="text-center mt-3">
              <Link href="/register-trainer" className="text-green-700 font-semibold hover:underline transition-colors flex items-center gap-1 justify-center text-sm">
                Want to become a trainer? <span className="underline">Apply here</span>
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
