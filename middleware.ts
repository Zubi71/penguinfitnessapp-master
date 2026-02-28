import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { serverAuthGuard, isPasswordResetRoute } from '@/lib/server-auth-guard'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and public assets
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.endsWith('.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // Special handling for password reset API - allow both authenticated and unauthenticated
  if (isPasswordResetRoute(pathname)) {
    return NextResponse.next()
  }

  // Handle API routes with authentication
  if (pathname.startsWith('/api/')) {
    // Skip middleware for public API routes
    if (pathname.startsWith('/api/login') || 
        pathname.startsWith('/api/register') || 
        pathname.startsWith('/api/auth/reset-password') ||
        pathname.startsWith('/api/auth/legacy-reset') ||
        pathname.startsWith('/api/auth/exchange-token') ||
        pathname.startsWith('/api/auth/exchange-code') ||
        pathname.startsWith('/api/verify-trainers') ||
        pathname.startsWith('/api/stripe/webhook') ||
        pathname.startsWith('/api/community-events/public') ||
        pathname.startsWith('/api/referrals/validate')) { // Allow referral code validation without auth
      return NextResponse.next()
    }
    
    // Admin API routes require special handling
    if (pathname.startsWith('/api/admin/')) {
      // Let the API route handle its own authentication using withStaff middleware
      return NextResponse.next()
    }
    
    // For protected API routes, run auth guard
    const authResult = await serverAuthGuard(request)
    
    // If auth guard wants to redirect, return error response for API routes
    if (!authResult.shouldContinue) {
      // Special handling for community events payment routes - allow clients to access
      if (pathname.match(/^\/api\/community-events\/[^\/]+\/(register)$/) || 
        pathname.match(/^\/api\/payment\/community-events\/[^\/]+$/)) {
        // Allow the request to continue for community events
        return NextResponse.next()
      }
      
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }
    
    // Update session for authenticated API requests
    if (authResult.user) {
      return await updateSession(request)
    }
    
    return NextResponse.next()
  }

  // Run server-side auth guard for page routes only
  const authResult = await serverAuthGuard(request)

  // If auth guard wants to redirect, do it
  if (!authResult.shouldContinue && authResult.response) {
    return authResult.response
  }

  // Only update session for authenticated/protected routes
  // If user is not authenticated, just continue (no session update)
  if (authResult.user) {
    return await updateSession(request)
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
}

