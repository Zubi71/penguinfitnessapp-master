import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
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
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all trainer applications with trainer data (use trainers table instead of instructors)
    const { data: applications, error } = await supabase
      .from('trainers')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        email,
        phone,
        hire_date,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching trainer applications:', error)
      return NextResponse.json(
        { message: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    // Also try to get additional application data if the table exists
    const { data: applicationMetadata } = await supabase
      .from('trainer_applications')
      .select('*')
      .in('user_id', applications?.map(app => app.user_id) || [])

    // Merge data
    const enrichedApplications = applications?.map(app => {
      const metadata = applicationMetadata?.find(meta => meta.user_id === app.user_id)
      return {
        ...app,
        date_of_birth: metadata?.date_of_birth || null,
        gender: metadata?.gender || null,
        availability: metadata?.availability || null,
        experience: metadata?.experience || null,
        background_check_consent: metadata?.background_check_consent || false,
        status: metadata?.status || 'pending'
      }
    }) || []

    return NextResponse.json({
      success: true,
      applications: enrichedApplications
    })

  } catch (error) {
    console.error('Trainer applications API error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
