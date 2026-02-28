import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { checkRouteAccess, getDefaultRedirect, isPublicRoute } from '@/lib/auth-utils'

export interface AuthGuardResult {
  user: any | null
  userRole: string | undefined
  response?: NextResponse
  shouldContinue: boolean
}

/**
 * Server-side AuthGuard for middleware
 * Similar to the client-side AuthGuard but for server-side route protection
 */
export async function serverAuthGuard(request: NextRequest): Promise<AuthGuardResult> {
  const { pathname } = request.nextUrl
  
  // Early return for static assets to reduce processing
  if (
    pathname.startsWith('/_next/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js)$/)
  ) {
    return {
      user: null,
      userRole: undefined,
      shouldContinue: true
    }
  }

  // Minimal logging for performance
  console.log('🛡️ ServerAuthGuard:', pathname)

  // Create Supabase client for the request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        },
      },
    }
  )

  try {
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.log('🔒 Auth error:', authError.message)
    }

    console.log('🔍 ServerAuthGuard - User:', user ? `${user.id} (${user.email})` : 'Not authenticated')

    // Get user role if authenticated - handle multiple roles gracefully
    let userRole: string | undefined
    if (user) {
      try {
        // Use service role client for role queries to ensure proper permissions
        const serviceSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        
        const { data: userRoles, error: roleError } = await serviceSupabase
          .from('user_roles')
          .select('role, id')
          .eq('user_id', user.id)
          .order('id', { ascending: false }) // Get most recent first
        
        if (roleError) {
          console.error('❌ Error fetching user role:', roleError.message)
        } else if (userRoles && userRoles.length > 0) {
          // Use the most recent role
          userRole = userRoles[0].role
          console.log('🔍 ServerAuthGuard - User role:', userRole)
          
          // If multiple roles found, log warning and clean up duplicates
          if (userRoles.length > 1) {
            console.warn(`⚠️ Multiple roles found for user ${user.id}, using most recent: ${userRole}`)
            
            // Clean up duplicate roles (keep only the most recent)
            const rolesToDelete = userRoles.slice(1)
            for (const roleToDelete of rolesToDelete) {
              await serviceSupabase
                .from('user_roles')
                .delete()
                .eq('id', roleToDelete.id)
            }
            console.log(`🧹 Cleaned up ${rolesToDelete.length} duplicate roles`)
          }
        }
      } catch (err) {
        console.error('❌ Exception fetching user role:', err)
      }
    }

    // Check route access
    const accessCheck = checkRouteAccess(pathname, userRole)
    console.log('🔍 ServerAuthGuard - Route access:', { pathname, userRole, accessCheck })

    // Handle unauthenticated users trying to access protected routes
    if (!user && accessCheck.requiresAuth) {
      console.log('🚫 Redirecting unauthenticated user to login')
      return {
        user: null,
        userRole: undefined,
        response: NextResponse.redirect(new URL('/login', request.url)),
        shouldContinue: false
      }
    }

    // Handle authenticated users with insufficient permissions
    if (user && !accessCheck.allowed && accessCheck.redirectTo) {
      console.log(`🔄 Redirecting user to: ${accessCheck.redirectTo}`)
      return {
        user,
        userRole,
        response: NextResponse.redirect(new URL(accessCheck.redirectTo, request.url)),
        shouldContinue: false
      }
    }

    // Handle root route redirects for authenticated users
    if (user && userRole && pathname === '/') {
      const redirectTo = getDefaultRedirect(userRole)
      console.log(`🏠 Redirecting authenticated user from root to: ${redirectTo}`)
      return {
        user,
        userRole,
        response: NextResponse.redirect(new URL(redirectTo, request.url)),
        shouldContinue: false
      }
    }

    // Access granted - continue with request
    return {
      user,
      userRole,
      shouldContinue: true
    }

  } catch (error) {
    console.error('❌ ServerAuthGuard error:', error)
    
    // On error, check if route is public
    const accessCheck = checkRouteAccess(pathname)
    
    if (!accessCheck.requiresAuth) {
      return {
        user: null,
        userRole: undefined,
        shouldContinue: true
      }
    }
    
    // Redirect to login for protected routes on error
    return {
      user: null,
      userRole: undefined,
      response: NextResponse.redirect(new URL('/login', request.url)),
      shouldContinue: false
    }
  }
}

/**
 * Special handling for password reset related routes
 * These routes need to work for both authenticated and unauthenticated users
 */
export function isPasswordResetRoute(pathname: string): boolean {
  return pathname.startsWith('/api/auth/reset-password') || 
         pathname.startsWith('/api/auth/exchange-code')
}
