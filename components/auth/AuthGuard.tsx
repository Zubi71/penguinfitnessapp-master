'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { checkRouteAccess, getDefaultRedirect, UserRole } from '@/lib/auth-utils'

interface AuthGuardProps {
  children: React.ReactNode
  requireRole?: 'admin' | 'trainer' | 'client' | 'staff' // 'staff' means admin OR trainer
  fallbackRoute?: string
}

export default function AuthGuard({ 
  children, 
  requireRole,
  fallbackRoute 
}: AuthGuardProps) {
  const [user, setUser] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const checkAuth = async () => {
    try {
      console.log('🛡️ ClientAuthGuard - Checking authentication for:', pathname)
      
      const response = await fetch('/api/auth', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.user) {
          const userData = result.user as UserRole
          setUser(userData)
          
          // Check route access if user is authenticated
          const accessCheck = checkRouteAccess(pathname, userData.role)
          
          console.log('🔍 ClientAuthGuard access check:', {
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
              const redirectTo = fallbackRoute || getDefaultRedirect(userData.role)
              router.push(redirectTo)
              return
            }
          }

          // Check general route access
          if (!accessCheck.allowed && accessCheck.redirectTo) {
            console.log(`🔄 Redirecting to: ${accessCheck.redirectTo} - Reason: ${accessCheck.reason}`)
            router.push(accessCheck.redirectTo)
            return
          }

          console.log('✅ Access granted')
          setAccessDenied(false)
        } else {
          console.log('🚫 Authentication failed')
          router.push('/login')
        }
      } else {
        console.log('🚫 Auth API call failed')
        router.push('/login')
      }
    } catch (error) {
      console.error('❌ ClientAuthGuard error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button 
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return <>{children}</>
}
