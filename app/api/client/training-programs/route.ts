import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth-middleware'

export const GET = withAuth(async (req) => {
  try {
    console.log('🎯 API /client/training-programs called')
    console.log('🔍 Getting training programs for client user:', req.user.id, 'Role:', req.user.role)

    // Only clients can access this endpoint
    if (req.user.role !== 'client') {
      console.log('❌ Unauthorized role:', req.user.role)
      return NextResponse.json(
        { error: 'Unauthorized - clients only' },
        { status: 403 }
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Find the client record by email
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, first_name, last_name, email')
      .eq('email', req.user.email)
      .single()

    if (clientError || !client) {
      console.log('❌ Client not found for email:', req.user.email)
      return NextResponse.json(
        { error: 'Client profile not found' },
        { status: 404 }
      )
    }

    console.log('✅ Found client:', client.id, client.first_name, client.last_name)
    console.log('🔄 Using simplified query without foreign key join')

    // Get training programs for this client (without trainer join for now)
    const { data: trainingPrograms, error: programsError } = await supabaseAdmin
      .from('training_programs')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })

    if (programsError) {
      console.error('❌ Error fetching training programs:', programsError)
      return NextResponse.json(
        { error: 'Failed to fetch training programs: ' + programsError.message },
        { status: 500 }
      )
    }

    console.log('✅ Found training programs:', trainingPrograms?.length || 0)

    // Get trainer information separately if we have training programs
    let enhancedPrograms = trainingPrograms || []
    if (trainingPrograms && trainingPrograms.length > 0) {
      for (const program of trainingPrograms) {
        if (program.trainer_id) {
          try {
            // Get trainer info from auth.users
            const { data: trainerUser } = await supabaseAdmin.auth.admin.getUserById(program.trainer_id)
            if (trainerUser.user) {
              program.trainer = {
                id: trainerUser.user.id,
                email: trainerUser.user.email,
                raw_user_meta_data: trainerUser.user.user_metadata
              }
            }
          } catch (trainerError) {
            console.warn('Could not fetch trainer info for:', program.trainer_id)
            program.trainer = null
          }
        }
      }
    }

    return NextResponse.json({
      client: client,
      trainingPrograms: enhancedPrograms
    })

  } catch (error) {
    console.error('❌ Client training programs API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
})
