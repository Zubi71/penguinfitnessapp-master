import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// DELETE /api/trainer-availability/[id] - Delete availability by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
            // Not needed for reading
          },
        },
      }
    )

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check user role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    // Only trainers can delete their own availability
    if (userRole.role !== 'trainer') {
      return NextResponse.json({ 
        error: 'Access denied. Trainer role required.' 
      }, { status: 403 })
    }

    // Get trainer ID
    const { data: trainer, error: trainerError } = await supabaseAdmin
      .from('trainers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (trainerError || !trainer) {
      return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 })
    }

    const { id } = await params

    // Verify the availability belongs to this trainer
    const { data: availability, error: fetchError } = await supabaseAdmin
      .from('trainer_availability')
      .select('trainer_id')
      .eq('id', id)
      .single()

    if (fetchError || !availability) {
      return NextResponse.json({ error: 'Availability not found' }, { status: 404 })
    }

    if (availability.trainer_id !== trainer.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('trainer_availability')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting availability:', error)
      return NextResponse.json({ 
        error: `Failed to delete availability: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in availability DELETE API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

