'use client'

import { usePermissions } from '@/components/auth/RoleGuard'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AdminOnlyGuardProps {
  children: React.ReactNode
  fallbackRoute?: string
  showMessage?: boolean
}

/**
 * Guard component that only allows admin users
 * Trainers will be redirected or shown an access denied message
 */
export function AdminOnlyGuard({ 
  children, 
  fallbackRoute = '/dashboard',
  showMessage = true
}: AdminOnlyGuardProps) {
  const { user, isAdmin } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (user && !isAdmin()) {
      console.log('🚫 AdminOnlyGuard - Access denied for non-admin user')
      router.push(fallbackRoute)
    }
  }, [user, isAdmin, router, fallbackRoute])

  if (!user) {
    return null // AuthGuard will handle this
  }

  if (!isAdmin()) {
    if (showMessage) {
      return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
            <p className="text-gray-600 mb-4">
              This page is restricted to administrators only.
            </p>
            <button
              onClick={() => router.push(fallbackRoute)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )
    }
    return null
  }

  return <>{children}</>
}

/**
 * Component that only renders for admin users
 * Use this for hiding UI elements from trainers
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = usePermissions()
  
  if (!isAdmin()) {
    return null
  }
  
  return <>{children}</>
}

/**
 * Component that only renders for trainers
 * Use this for trainer-specific UI elements
 */
export function TrainerOnly({ children }: { children: React.ReactNode }) {
  const { isTrainer } = usePermissions()
  
  if (!isTrainer()) {
    return null
  }
  
  return <>{children}</>
}

/**
 * Component that renders for both admin and trainer (staff)
 * Use this for general management UI elements
 */
export function StaffOnly({ children }: { children: React.ReactNode }) {
  const { isStaff } = usePermissions()
  
  if (!isStaff()) {
    return null
  }
  
  return <>{children}</>
}

export default AdminOnlyGuard
