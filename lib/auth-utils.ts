// Shared auth utilities for both client and server-side authentication

export interface UserRole {
  id: string
  email: string
  role: 'admin' | 'trainer' | 'client'
  profile?: any
}

export interface RouteAccess {
  allowed: boolean
  requiresAuth: boolean
  redirectTo?: string
  reason?: string
}

// Public routes that don't require authentication
export const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/register-trainer',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/confirm'
]

// Public API routes that don't require authentication
export const PUBLIC_API_ROUTES = [
  '/api/login',
  '/api/register',
  '/api/register-trainer',
  '/api/auth/reset-password',
  '/api/auth/legacy-reset',
  '/api/auth/exchange-token',
  '/api/auth/exchange-code',
  '/api/verify-trainers', // Add verification endpoint
  '/api/stripe/webhook' // Stripe webhook endpoint
]

// Routes that require admin/trainer role (general management features)
export const STAFF_ROUTES = [
  '/dashboard',
  '/dashboard/chat',
  '/trainer',                  // Trainer dashboard page
  '/api/dashboard',
  '/api/insights',             // Insights dashboard API
  '/api/classes',
  '/api/clients',
  '/api/attendance',
  '/api/instructors',          // Instructors API (backward compatibility)
  '/api/trainers',             // Trainers can access trainers API
  '/api/trainer-availability', // Trainer availability management
  '/api/enrollments',
  '/api/invoices',             // Trainers can create invoices for their clients
  '/api/invoices/send',        // Trainers can send invoices
  '/api/invoices/[id]',        // Trainers can access specific invoices
  '/api/get-available-clients', // Trainers can get available clients
  '/api/search-user',          // Trainers can search for users
  '/api/trainer/add-client',   // Trainers can add clients
  // '/api/training-instructions', // Trainers can manage training instructions
  '/api/exercises',            // Exercise library and search functionality
  '/api/test-auth',            // Test auth endpoint
  '/api/set-progress',         // Trainers can manage set progress
  '/dashboard/clients',        // Trainers can view client details
  '/dashboard/classes',        // Trainers can manage classes
  '/dashboard/attendance',     // Trainers can mark attendance
  '/dashboard/calendar',       // Trainers can view calendar
  '/dashboard/instructors',    // Trainers can view instructors
  '/dashboard/trainer',        // Trainers can access trainer dashboard
  '/dashboard/settings',       // Trainers can access settings
  '/dashboard/insights',       // Insights dashboard page
  '/api/client-status',        // Trainers can view student status
  '/api/community-events',     // Community events management (admin/trainer)
  '/dashboard/community-events', // Community events dashboard (admin/trainer)
  '/trainer/referrals',        // Trainer referral dashboard
  '/trainer/availability',      // Trainer availability page
  '/dashboard/referrals',      // Admin referral dashboard
  '/dashboard/trainer-availability' // Admin trainer availability view
]

// Routes that require admin role only (billing, reports, subscriptions, system management)
export const ADMIN_ONLY_ROUTES = [
  '/dashboard/billing',         // Only billing dashboard page
  '/dashboard/invoices',        // Only admins can manage invoice dashboard
  '/dashboard/subscriptions',   // Only admins can manage subscriptions
  '/dashboard/trainer-applications', // Only admins can manage trainer applications
  '/api/stripe',                // Stripe integration
  '/api/billing-reports',       // Financial reports
  '/api/revenue-analytics',     // Revenue analytics
  '/api/invoices/update',       // Invoice updates (system level)
  '/api/subscriptions',         // Subscription management
  '/api/trainer-applications' ,  // Trainer application management
]

// Routes that clients can access
export const CLIENT_ROUTES = [
  '/account',
  '/client',
  '/api/account',
  '/api/client',
  '/api/client-by-email',
  '/api/set-progress',
  '/api/training-instructions',
  '/api/training-instructions/client-instructions',
  '/api/weight-tracker/client-data',
  '/api/weight-tracker/add-entry',
  '/client/instructions',
  '/client/tracker',
  '/client/community-events',  // Client community events page
  '/client/payment/[id]',
  '/client/community-events/register/[id]',
  '/client/payment',
  '/client/feedback',
  '/api/feedback',
  '/client/referrals'  // Client referral dashboard
]

// Routes that any authenticated user can access
export const AUTHENTICATED_ROUTES = [
  '/api/auth', // Auth status check
  '/api/auth/me', // Get current user info
  '/api/logout',
  '/api/send-email',
  '/api/send-notification',
  '/api/client/points', // Client points and rewards (any authenticated user)
  // Referral system routes (any authenticated user can create and track referrals)
  '/api/referrals',
  '/api/referrals/codes',
  '/api/referrals/tracking',
  '/api/referrals/analytics',
  '/api/referrals/validate',
  '/api/referrals/complete',
  '/api/test-referral-access'
]

// Helper function to match dynamic routes
function matchesRoute(pathname: string, routePattern: string): boolean {
  // Convert route pattern to regex
  const regexPattern = routePattern
    .replace(/\[([^\]]+)\]/g, '[^/]+') // Replace [id] with [^/]+
    .replace(/\//g, '\\/') // Escape forward slashes
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(pathname)
}

// Helper function to check if pathname matches any route in an array
function matchesAnyRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => {
    if (route.includes('[')) {
      // Dynamic route with parameters
      return matchesRoute(pathname, route)
    } else {
      // Static route
      return pathname.startsWith(route)
    }
  })
}

/**
 * Check if a route requires authentication and if user has access
 */
export function checkRouteAccess(pathname: string, userRole?: string): RouteAccess {
  // Fast path for client routes - check first for better performance
  if (pathname.startsWith('/client/') || pathname.startsWith('/api/training-instructions/client-instructions')) {
    if (!userRole) {
      return { 
        allowed: false, 
        requiresAuth: true, 
        redirectTo: '/login',
        reason: 'Authentication required'
      }
    }
    if (userRole !== 'client') {
      return { 
        allowed: false, 
        requiresAuth: true, 
        redirectTo: '/dashboard',
        reason: 'Client-only route accessed by admin/trainer'
      }
    }
    return { allowed: true, requiresAuth: true }
  }

  // Check if route is public
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return { allowed: true, requiresAuth: false }
  }

  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
    return { allowed: true, requiresAuth: false }
  }

  // Check for community events dynamic routes (any authenticated user can access)
      if (pathname.match(/^\/api\/community-events\/[^\/]+\/(register)$/) || 
        pathname.match(/^\/api\/payment\/community-events\/[^\/]+$/)) {
    if (!userRole) {
      return { 
        allowed: false, 
        requiresAuth: true, 
        redirectTo: '/login',
        reason: 'Authentication required for community events'
      }
    }
    return { allowed: true, requiresAuth: true }
  }

  // All other routes require authentication
  if (!userRole) {
    return { 
      allowed: false, 
      requiresAuth: true, 
      redirectTo: '/login',
      reason: 'Authentication required'
    }
  }

  // Check admin-only routes (billing/payments)
  if (matchesAnyRoute(pathname, ADMIN_ONLY_ROUTES)) {
    if (userRole !== 'admin') {
      return { 
        allowed: false, 
        requiresAuth: true, 
        redirectTo: userRole === 'client' ? '/client' : '/dashboard',
        reason: 'Admin-only access required (billing/payments)'
      }
    }
    return { allowed: true, requiresAuth: true }
  }

  // Check staff routes (admin/trainer)
  // Also check for trainer-availability routes (including dynamic [id] routes)
  if (matchesAnyRoute(pathname, STAFF_ROUTES) || 
      pathname.startsWith('/api/trainer-availability')) {
    if (userRole === 'client') {
      return { 
        allowed: false, 
        requiresAuth: true, 
        redirectTo: '/client',
        reason: 'Staff access required (admin or trainer)'
      }
    }
    return { allowed: true, requiresAuth: true }
  }

  // Check client routes
  if (matchesAnyRoute(pathname, CLIENT_ROUTES)) {
    if (userRole !== 'client') {
      return { 
        allowed: false, 
        requiresAuth: true, 
        redirectTo: '/dashboard',
        reason: 'Client-only route accessed by admin/trainer'
      }
    }
    return { allowed: true, requiresAuth: true }
  }

  // Check authenticated routes (any role)
  if (matchesAnyRoute(pathname, AUTHENTICATED_ROUTES)) {
    return { allowed: true, requiresAuth: true }
  }

  // Default: redirect based on role for unspecified routes
  if (userRole === 'client') {
    return { 
      allowed: false, 
      requiresAuth: true, 
      redirectTo: '/client',
      reason: 'Default redirect for client'
    }
  } else {
    return { 
      allowed: false, 
      requiresAuth: true, 
      redirectTo: '/dashboard',
      reason: 'Default redirect for staff (admin/trainer)'
    }
  }
}

/**
 * Get the default redirect URL for a user based on their role
 */
export function getDefaultRedirect(userRole: string): string {
  if (userRole === 'client') return '/client'
  if (userRole === 'trainer') return '/trainer'
  return '/dashboard' // admin
}

/**
 * Check if a route is public (doesn't require authentication)
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route)) ||
         PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Check if user has permission to access a specific route
 */
export function hasRoutePermission(pathname: string, userRole: string): boolean {
  const access = checkRouteAccess(pathname, userRole)
  return access.allowed
}

/**
 * Check if user has a specific role or higher permission
 */
export function hasRole(userRole: string, requiredRole: 'admin' | 'trainer' | 'client'): boolean {
  if (requiredRole === 'client') {
    return ['client', 'trainer', 'admin'].includes(userRole)
  }
  if (requiredRole === 'trainer') {
    return ['trainer', 'admin'].includes(userRole)
  }
  if (requiredRole === 'admin') {
    return userRole === 'admin'
  }
  return false
}
