'use client'

import React from 'react'
import { useAuthGuard } from '@/hooks/auth/use-auth-guard'

interface RoleGuardProps {
  children: React.ReactNode
  requireRole: 'admin' | 'trainer' | 'client' | 'staff' // 'staff' means admin OR trainer
  fallback?: React.ReactNode
  showLoading?: boolean
  showFallback?: boolean
}

/**
 * Component for conditional rendering based on user role
 * Use this for showing/hiding UI elements based on permissions
 */
export function RoleGuard({ 
  children, 
  requireRole, 
  fallback = <UnauthorizedMessage />,
  showLoading = false,
  showFallback = true
}: RoleGuardProps) {
  const { user, loading, checkPermission } = useAuthGuard({ 
    redirectOnError: false 
  })

  if (loading && showLoading) {
    return <LoadingMessage />
  }

  if (loading && !showLoading) {
    return null
  }

  if (!user) {
    return showFallback ? <UnauthorizedMessage /> : null
  }

  if (!checkPermission(requireRole)) {
    return showFallback ? fallback : null
  }

  return <>{children}</>
}

// Helper components for specific roles
export function AdminGuard({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <RoleGuard requireRole="admin" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function TrainerGuard({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <RoleGuard requireRole="trainer" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function ClientGuard({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <RoleGuard requireRole="client" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function StaffGuard({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <RoleGuard requireRole="staff" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

// Hook for checking permissions in components
export function usePermissions() {
  const { user, checkPermission } = useAuthGuard({ redirectOnError: false })

  const checkRole = (role: 'admin' | 'trainer' | 'client'): boolean => {
    if (!user) return false
    return user.role === role
  }

  const isAdmin = (): boolean => checkRole('admin')
  const isTrainer = (): boolean => checkRole('trainer')
  const isClient = (): boolean => checkRole('client')
  const isStaff = (): boolean => checkPermission('staff')

  return {
    user,
    checkPermission,
    checkRole,
    isAdmin,
    isTrainer,
    isClient,
    isStaff,
  }
}

function LoadingMessage() {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600 text-sm">Loading...</span>
    </div>
  )
}

function UnauthorizedMessage() {
  return (
    <div className="text-center py-4">
      <div className="text-gray-400 text-sm">
        🔒 You don't have permission to view this content
      </div>
    </div>
  )
}

// Default export for backwards compatibility
export default RoleGuard
