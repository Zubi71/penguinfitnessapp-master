import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth-middleware'

interface SetProgress {
  weight: string
  reps: string
}

interface SetProgressData {
  [key: string]: SetProgress
}

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json()
    const { exerciseId, trainingDayId, clientId, setProgress }: {
      exerciseId: string
      trainingDayId: string
      clientId: string
      setProgress: SetProgressData
    } = body

    console.log('🔍 POST /api/set-progress - Parameters:', {
      exerciseId,
      trainingDayId,
      clientId,
      setProgressKeys: Object.keys(setProgress || {}),
      userRole: req.user.role,
      userId: req.user.id
    })

    if (!exerciseId || !trainingDayId || !clientId || !setProgress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create admin client for database operations
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

    const userRole = req.user.role
    let trainerId: string | null = null

    console.log('🔍 Checking user role:', userRole)

    // Handle different user roles
    if (userRole === 'trainer' || userRole === 'admin') {
      console.log('🔍 Checking trainer access...')
      
      // Get the actual trainer record ID from the trainers table
      const { data: trainerData, error: trainerError } = await supabaseAdmin
        .from('trainers')
        .select('id')
        .eq('user_id', req.user.id)
        .single()

      console.log('🔍 Trainer lookup result:', { trainerData, trainerError })

      if (trainerError || !trainerData) {
        console.log('❌ Trainer not found in trainers table:', { trainerError, trainerData })
        return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
      }

      trainerId = trainerData.id
      console.log('🔍 Using trainer ID from trainers table:', trainerId)

      // Verify client belongs to this trainer
      const { data: clientExists, error: clientExistsError } = await supabaseAdmin
        .from('clients')
        .select('id, trainer_id, email')
        .eq('id', clientId)
        .single()

      console.log('🔍 Client exists check:', { clientExists, clientExistsError })

      if (clientExistsError || !clientExists) {
        console.log('❌ Client does not exist:', { clientExistsError, clientExists })
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      // Check if client belongs to this trainer
      if (clientExists.trainer_id && clientExists.trainer_id !== req.user.id) {
        console.log('❌ Client does not belong to this trainer:', {
          clientTrainerId: clientExists.trainer_id,
          currentUserId: req.user.id
        })
        return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 })
      }

      console.log('✅ Client verified:', clientExists)
    } else if (userRole === 'client') {
      console.log('🔍 Checking client access...')
      
      // Verify this is the client's own data by checking user_id
      const { data: clientData, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('id, trainer_id, user_id, email')
        .eq('id', clientId)
        .single()

      console.log('🔍 Client query result:', { clientData, clientError })

      if (clientError || !clientData) {
        console.log('❌ Client not found:', { clientError, clientData })
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      // Check if client user_id matches current user id
      if (clientData.user_id !== req.user.id) {
        console.log('❌ Client does not belong to this user:', {
          clientUserId: clientData.user_id,
          currentUserId: req.user.id
        })
        return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 })
      }

      // For clients, we need to get the trainer_id from the trainers table
      if (clientData.trainer_id) {
        const { data: trainerData, error: trainerError } = await supabaseAdmin
          .from('trainers')
          .select('id')
          .eq('user_id', clientData.trainer_id)
          .single()

        if (!trainerError && trainerData) {
          trainerId = trainerData.id
        }
      }

      console.log('✅ Client verified:', clientData)
      console.log('🔍 Trainer ID from client:', trainerId)
    } else {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 403 })
    }

    console.log('🔍 Saving progress entries...')
    
    // Save each set progress
    const progressEntries = []
    for (const [setNumber, progress] of Object.entries(setProgress as SetProgressData)) {
      // Add proper type checking for progress
      if (progress && typeof progress === 'object' && 'weight' in progress && 'reps' in progress && (progress.weight || progress.reps)) {
        const setData = {
          exercise_id: exerciseId,
          training_day_id: trainingDayId,
          client_id: clientId,
          trainer_id: trainerId,
          set_number: parseInt(setNumber) + 1, // Convert from 0-based to 1-based
          weight: progress.weight || null,
          reps: progress.reps || null,
          completed_at: new Date().toISOString()
        }
        
        console.log('🔍 Saving set data:', setData)
        
        const { data, error } = await supabaseAdmin
          .from('set_progress')
          .upsert(setData, {
            onConflict: 'exercise_id,training_day_id,client_id,set_number'
          })

        if (error) {
          console.error('❌ Error saving set progress:', error)
          return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
        }

        console.log('✅ Set saved successfully:', data)
        progressEntries.push(data)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Progress saved successfully',
      savedEntries: progressEntries.length
    })

  } catch (error) {
    console.error('Error in set progress API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const exerciseId = searchParams.get('exerciseId')
    const trainingDayId = searchParams.get('trainingDayId')
    const clientId = searchParams.get('clientId')

    console.log('🔍 GET /api/set-progress - Parameters:', {
      exerciseId,
      trainingDayId,
      clientId,
      userRole: req.user.role,
      userId: req.user.id
    })

    if (!exerciseId || !trainingDayId || !clientId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Create admin client for database operations
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

    const userRole = req.user.role

    // Verify access based on user role
    if (userRole === 'trainer' || userRole === 'admin') {
      console.log('🔍 Checking trainer access...')
      
      // Get the actual trainer record ID from the trainers table
      const { data: trainerData, error: trainerError } = await supabaseAdmin
        .from('trainers')
        .select('id')
        .eq('user_id', req.user.id)
        .single()

      console.log('🔍 Trainer lookup result:', { trainerData, trainerError })

      if (trainerError || !trainerData) {
        console.log('❌ Trainer not found in trainers table:', { trainerError, trainerData })
        return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
      }

      console.log('🔍 Using trainer ID from trainers table:', trainerData.id)

      // Verify client belongs to this trainer
      const { data: clientExists, error: clientExistsError } = await supabaseAdmin
        .from('clients')
        .select('id, trainer_id, email')
        .eq('id', clientId)
        .single()

      console.log('🔍 Client exists check:', { clientExists, clientExistsError })

      if (clientExistsError || !clientExists) {
        console.log('❌ Client does not exist:', { clientExistsError, clientExists })
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      // Check if client belongs to this trainer
      if (clientExists.trainer_id && clientExists.trainer_id !== req.user.id) {
        console.log('❌ Client does not belong to this trainer:', {
          clientTrainerId: clientExists.trainer_id,
          currentUserId: req.user.id
        })
        return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 })
      }

      console.log('✅ Client verified:', clientExists)
    } else if (userRole === 'client') {
      console.log('🔍 Checking client access...')
      
      // Verify this is the client's own data by checking user_id
      const { data: clientExists, error: clientExistsError } = await supabaseAdmin
        .from('clients')
        .select('id, user_id, email')
        .eq('id', clientId)
        .single()

      console.log('🔍 Client exists check:', { clientExists, clientExistsError })

      if (clientExistsError || !clientExists) {
        console.log('❌ Client does not exist:', { clientExistsError, clientExists })
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      // Verify this is the client's own data by checking user_id
      if (clientExists.user_id !== req.user.id) {
        console.log('❌ Client does not belong to this user:', {
          clientUserId: clientExists.user_id,
          currentUserId: req.user.id
        })
        return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 })
      }

      console.log('✅ Client verified:', clientExists)
    } else {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 403 })
    }

    console.log('🔍 Querying set progress...')
    
    // Query set progress
    const { data: progress, error } = await supabaseAdmin
      .from('set_progress')
      .select('*')
      .eq('exercise_id', exerciseId)
      .eq('training_day_id', trainingDayId)
      .eq('client_id', clientId)
      .order('set_number')

    console.log('🔍 Set progress query result:', { progress, error })

    if (error) {
      console.error('Error fetching set progress:', error)
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    // Convert to the format expected by the frontend
    const formattedProgress: { [key: number]: SetProgress } = {}
    progress?.forEach((entry) => {
      const setIndex = entry.set_number - 1 // Convert from 1-based to 0-based
      formattedProgress[setIndex] = {
        weight: entry.weight || '',
        reps: entry.reps || ''
      }
    })

    return NextResponse.json({ 
      success: true, 
      progress: formattedProgress
    })

  } catch (error) {
    console.error('Error in set progress GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}) 