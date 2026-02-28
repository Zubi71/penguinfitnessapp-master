'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UserRole, checkRouteAccess, getDefaultRedirect } from '@/lib/auth-utils'

export interface UseAuthGuardOptions {
  requireRole?: 'admin' | 'trainer' | 'client' | 'staff' // 'staff' means admin OR trainer
  fallbackRoute?: string
  redirectOnError?: boolean
}

export interface UseAuthGuardResult {
  user: UserRole | null
  loading: boolean
  accessDenied: boolean
  isAuthenticated: boolean
  hasPermission: boolean
  checkPermission: (role: string) => boolean
  refreshAuth: () => Promise<void>
}

/**
 * Custom hook for authentication and authorization
 * Can be used in components that need auth state without wrapping in AuthGuard
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}): UseAuthGuardResult {
  const {
    requireRole,
    fallbackRoute,
    redirectOnError = true
  } = options

  const [user, setUser] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = async () => {
    try {
      console.log('🔐 useAuthGuard - Checking authentication')
      
      const response = await fetch('/api/auth', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.user) {
          const userData = result.user as UserRole
          setUser(userData)
          
          // Check route access
          const accessCheck = checkRouteAccess(pathname, userData.role)
          
          console.log('🔍 useAuthGuard access check:', {
            pathname,
            userRole: userData.role,
            requireRole,
            accessCheck
          })

          // Check specific role requirement if provided
          if (requireRole) {
            let hasRequiredRole = false
            
            if (requireRole === 'staff') {
              hasRequiredRole = userData.role === 'admin' || userData.role === 'trainer'
            } else {
              hasRequiredRole = userData.role === requireRole
            }

            if (!hasRequiredRole) {
              console.log('🚫 Access denied - insufficient role')
              setAccessDenied(true)
              if (redirectOnError) {
                const redirectTo = fallbackRoute || getDefaultRedirect(userData.role)
                router.push(redirectTo)
              }
              return
            }
          }

          // Check general route access
          if (!accessCheck.allowed && accessCheck.redirectTo && redirectOnError) {
            console.log(`🔄 Redirecting to: ${accessCheck.redirectTo}`)
            router.push(accessCheck.redirectTo)
            return
          }

          setAccessDenied(false)
        } else {
          console.log('🚫 Authentication failed')
          setUser(null)
          if (redirectOnError) {
            router.push('/login')
          }
        }
      } else {
        console.log('🚫 Auth API call failed')
        setUser(null)
        if (redirectOnError) {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('❌ useAuthGuard error:', error)
      setUser(null)
      if (redirectOnError) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const checkPermission = (role: string): boolean => {
    if (!user) return false
    
    if (role === 'staff') {
      return user.role === 'admin' || user.role === 'trainer'
    }
    
    return user.role === role
  }

  const refreshAuth = async () => {
    setLoading(true)
    await checkAuth()
  }

  useEffect(() => {
    checkAuth()
  }, [pathname])

  return {
    user,
    loading,
    accessDenied,
    isAuthenticated: !!user,
    hasPermission: user ? !accessDenied : false,
    checkPermission,
    refreshAuth
  }
}
