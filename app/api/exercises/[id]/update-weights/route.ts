import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth-middleware'

export const PUT = withAuth(async (req) => {
  try {
    const exerciseId = req.url.split('/').pop() // Get exercise ID from URL
    const body = await req.json()
    const { weight, reps, sets } = body

    console.log('🔍 PUT /api/exercises/[id]/update-weights - Parameters:', {
      exerciseId,
      weight,
      reps,
      sets,
      userRole: req.user.role,
      userId: req.user.id
    })

    // Only trainers can update exercise weights and reps
    if (req.user.role !== 'trainer' && req.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - trainers only' }, { status: 403 })
    }

    if (!exerciseId) {
      return NextResponse.json({ error: 'Missing exercise ID' }, { status: 400 })
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

    // Get trainer ID
    const { data: trainerData, error: trainerError } = await supabaseAdmin
      .from('trainers')
      .select('id')
      .eq('user_id', req.user.id)
      .single()

    if (trainerError || !trainerData) {
      console.log('❌ Trainer not found:', { trainerError, trainerData })
      return NextResponse.json({ error: 'Trainer not found' }, { status: 404 })
    }

    // Verify trainer has access to this exercise
    const { data: exerciseData, error: exerciseError } = await supabaseAdmin
      .from('exercises')
      .select('id, training_day_id')
      .eq('id', exerciseId)
      .single()

    if (exerciseError || !exerciseData) {
      console.log('❌ Exercise not found:', { exerciseError, exerciseData })
      return NextResponse.json({ error: 'Exercise not found' }, { status: 404 })
    }

    // Get the training day and check if trainer has access
    const { data: trainingDayData, error: trainingDayError } = await supabaseAdmin
      .from('training_days')
      .select('id, cycle_id')
      .eq('id', exerciseData.training_day_id)
      .single()

    if (trainingDayError || !trainingDayData) {
      console.log('❌ Training day not found:', { trainingDayError, trainingDayData })
      return NextResponse.json({ error: 'Training day not found' }, { status: 404 })
    }

    // Get the training program and client
    const { data: trainingProgramData, error: trainingProgramError } = await supabaseAdmin
      .from('training_programs')
      .select('id, client_id')
      .eq('id', trainingDayData.cycle_id)
      .single()

    if (trainingProgramError || !trainingProgramData) {
      console.log('❌ Training program not found:', { trainingProgramError, trainingProgramData })
      return NextResponse.json({ error: 'Training program not found' }, { status: 404 })
    }

    // Check if the client belongs to this trainer
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('trainer_id')
      .eq('id', trainingProgramData.client_id)
      .single()

    if (clientError || !clientData) {
      console.log('❌ Client not found:', { clientError, clientData })
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (clientData.trainer_id !== req.user.id) {
      console.log('❌ Exercise does not belong to this trainer:', {
        clientTrainerId: clientData.trainer_id,
        currentUserId: req.user.id
      })
      return NextResponse.json({ error: 'Exercise not found or access denied' }, { status: 404 })
    }

    // Update the exercise
    const updateData: any = {}
    if (weight !== undefined) updateData.weight = weight
    if (reps !== undefined) updateData.reps = reps
    if (sets !== undefined) updateData.sets = sets

    const { data: updatedExercise, error: updateError } = await supabaseAdmin
      .from('exercises')
      .update(updateData)
      .eq('id', exerciseId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating exercise:', updateError)
      return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 })
    }

    console.log('✅ Exercise updated successfully:', updatedExercise)

    return NextResponse.json({
      success: true,
      message: 'Exercise updated successfully',
      exercise: updatedExercise
    })

  } catch (error) {
    console.error('Error in update exercise weights API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
