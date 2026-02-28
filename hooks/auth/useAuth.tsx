'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  role: string
  profile?: {
    first_name: string
    last_name: string
    email: string
    phone: string
  } | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check authentication status on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUser(result.user)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setUser(result.user)
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  const logout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      })

      // Clear user state regardless of API response
      setUser(null)
      
      // Clear session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('user')
      }

      // Redirect to login
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear user state and redirect on error
      setUser(null)
      router.push('/login')
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Custom hook for protecting routes
export function useAuthRequired() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  return { user, loading }
}
