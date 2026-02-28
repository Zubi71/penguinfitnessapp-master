import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { hasPermission, canAccessRoute, Permission } from '@/lib/rbac'

interface User {
  id: string
  email: string
  role: string
  profile?: any
}

export interface AuthenticatedRequest extends NextRequest {
  user: User
}

// API Route protection middleware
export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Create Supabase client for server-side operations (like in serverAuthGuard)
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return req.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
            },
          },
        }
      )

      // Get user from session
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !authUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }

      // Get user role - handle multiple roles gracefully
      const { data: userRoles, error: roleError } = await supabase
        .from('user_roles')
        .select('role, id')
        .eq('user_id', authUser.id)
        .order('id', { ascending: false }) // Get most recent first
      
      if (roleError) {
        console.error('Role check error in middleware:', roleError.message)
        return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 })
      }

      if (!userRoles || userRoles.length === 0) {
        return NextResponse.json({ error: 'User role not found' }, { status: 403 })
      }

      // If multiple roles, clean them up and use the most recent one
      if (userRoles.length > 1) {
        console.warn(`User ${authUser.id} has ${userRoles.length} roles, cleaning up...`)
        
        // Keep the most recent role (first in the ordered list)
        const keepRole = userRoles[0]
        const deleteRoles = userRoles.slice(1)

        // Delete duplicate roles
        for (const role of deleteRoles) {
          await supabase
            .from('user_roles')
            .delete()
            .eq('id', role.id)
        }

        console.log(`Cleaned up ${deleteRoles.length} duplicate roles for user ${authUser.id}`)
      }

      const userRoleData = userRoles[0]

      // Get profile data only if needed (optimize for client routes)
      let profile: any = null
      if (userRoleData.role === 'client') {
        // For client routes, we can skip profile data to improve performance
        // Only fetch if the handler specifically needs it
        profile = { email: authUser.email }
      } else {
        const { data: generalProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('id', authUser.id)
          .single()
        profile = generalProfile
      }

      const user: User = {
        id: authUser.id,
        email: authUser.email!,
        role: userRoleData.role,
        profile
      }

      // Add user to request
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = user

      return handler(authenticatedReq)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// Role-based protection middleware
export function withRole(requiredRole: string) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
      if (req.user.role !== requiredRole) {
        return NextResponse.json({ 
          error: `Access denied. Required role: ${requiredRole}` 
        }, { status: 403 })
      }
      
      return handler(req)
    })
  }
}

// Permission-based protection middleware
export function withPermission(requiredPermission: Permission) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
      if (!hasPermission(req.user.role, requiredPermission)) {
        return NextResponse.json({ 
          error: `Access denied. Required permission: ${requiredPermission}` 
        }, { status: 403 })
      }
      
      return handler(req)
    })
  }
}

// Admin only middleware
export function withAdmin(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withRole('admin')(handler)
}

// Staff only middleware (Admin + Trainer)
export function withStaff(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
    if (req.user.role !== 'admin' && req.user.role !== 'trainer') {
      return NextResponse.json({ 
        error: 'Access denied. Staff access required.' 
      }, { status: 403 })
    }
    
    return handler(req)
  })
}

// Client only middleware
export function withClient(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withRole('client')(handler)
}

// Multiple roles middleware
export function withRoles(allowedRoles: string[]) {
  return function(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return withAuth(async (req: AuthenticatedRequest): Promise<NextResponse> => {
      if (!allowedRoles.includes(req.user.role)) {
        return NextResponse.json({ 
          error: `Access denied. Allowed roles: ${allowedRoles.join(', ')}` 
        }, { status: 403 })
      }
      
      return handler(req)
    })
  }
}

// Helper function to check if user can access specific resource
export async function canAccessResource(
  userId: string,
  userRole: string,
  resourceType: 'client' | 'class' | 'enrollment' | 'payment' | 'invoice',
  resourceId: string
): Promise<boolean> {
  // Admin can access everything
  if (userRole === 'admin') {
    return true
  }

  // Create server client for resource access checks
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll(cookiesToSet) {
          // Not needed for resource checks
        },
      },
    }
  )

  switch (resourceType) {
    case 'client':
      if (userRole === 'client') {
        // Clients can only access their own data
        const { data } = await supabase
          .from('clients')
          .select('user_id')
          .eq('id', resourceId)
          .single()
        return data?.user_id === userId
      }
      // Instructors can access all clients
      return userRole === 'instructor'

    case 'class':
      if (userRole === 'instructor') {
        // Instructors can access their assigned classes
        const { data } = await supabase
          .from('classes')
          .select('instructor_id')
          .eq('id', resourceId)
          .single()
        
        const { data: instructor } = await supabase
          .from('instructors')
          .select('id')
          .eq('user_id', userId)
          .single()
        
        return data?.instructor_id === instructor?.id
      }
      if (userRole === 'client') {
        // Clients can access classes they're enrolled in
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', userId)
          .single()
        
        const { data } = await supabase
          .from('class_enrollments')
          .select('id')
          .eq('client_id', client?.id)
          .eq('class_id', resourceId)
          .single()
        
        return !!data
      }
      return false

    case 'enrollment':
      if (userRole === 'client') {
        // Clients can access their own enrollments
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', userId)
          .single()
        
        const { data } = await supabase
          .from('class_enrollments')
          .select('client_id')
          .eq('id', resourceId)
          .single()
        
        return data?.client_id === client?.id
      }
      // Instructors can access enrollments for their classes
      return userRole === 'instructor'

    case 'payment':
    case 'invoice':
      if (userRole === 'client') {
        // Clients can access their own payments/invoices
        const { data: client } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', userId)
          .single()
        
        const { data } = await supabase
          .from(resourceType === 'payment' ? 'payments' : 'invoices')
          .select('client_id')
          .eq('id', resourceId)
          .single()
        
        return data?.client_id === client?.id
      }
      // Instructors can view all payments/invoices (read-only)
      return userRole === 'instructor'

    default:
      return false
  }
}
