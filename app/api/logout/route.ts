import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error.message)
      return NextResponse.json(
        { error: 'Logout failed' },
        { status: 500 }
      )
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

    // Clear authentication cookies
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
    
    // Clear all Supabase related cookies
    response.cookies.delete('supabase-auth-token')
    response.cookies.delete('supabase.auth.token')

    console.log('User logged out successfully')

    return response

  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
