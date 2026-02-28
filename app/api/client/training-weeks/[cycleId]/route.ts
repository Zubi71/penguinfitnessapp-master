import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth-middleware'

export const GET = withAuth(async (req) => {
  try {
    // Extract cycleId from the URL
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const cycleId = pathParts[pathParts.length - 1] // Get the last part of the URL

    console.log('📞 Fetching weeks for cycle:', cycleId, 'for user:', req.user.email)

    // Only clients can access this endpoint
    if (req.user.role !== 'client') {
      console.log('❌ Unauthorized role:', req.user.role)
      return NextResponse.json(
        { error: 'Unauthorized - clients only' },
        { status: 403 }
      )
    }

    // Create admin client for database access
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

    // First, verify the user has access to this training program
    const { data: programData, error: programError } = await supabaseAdmin
      .from('training_programs')
      .select('*')
      .eq('id', cycleId)
      .eq('client_id', client.id)
      .single()

    if (programError || !programData) {
      console.error('❌ Program access error:', programError)
      return NextResponse.json({ error: 'Training program not found or access denied' }, { status: 404 })
    }

    console.log('✅ Found training program:', programData.name)

    // Try to fetch weeks from training_days table
    let weeksData: Array<{ week_number: number; cycle_id: string }> = []
    let weeksError: any = null

    try {
      const { data: trainingDaysData, error: daysError } = await supabaseAdmin
        .from('training_days')
        .select('week_number, cycle_id')
        .eq('cycle_id', cycleId)
        .order('week_number', { ascending: true })

      if (daysError) {
        console.error('❌ Error fetching training days:', daysError)
        // If table doesn't exist or RLS issues, we'll handle it gracefully
        weeksError = daysError
      } else {
        weeksData = trainingDaysData || []
      }
    } catch (error) {
      console.error('❌ Exception fetching training days:', error)
      weeksError = error
    }

    // If we can't fetch from training_days, return empty weeks array
    if (weeksError) {
      console.log('⚠️ Could not fetch training days, returning empty weeks')
      return NextResponse.json({
        weeks: [],
        cycle: programData,
        message: 'No training weeks have been created yet by your trainer.'
      })
    }

    // Get unique weeks and their completion status
    const uniqueWeeks = [...new Set(weeksData.map(day => day.week_number))]
    
    if (uniqueWeeks.length === 0) {
      console.log('✅ No training weeks found for this cycle')
      return NextResponse.json({
        weeks: [],
        cycle: programData,
        message: 'No training weeks have been created yet by your trainer.'
      })
    }

    // For each week, check completion status
    const weeksWithStatus = await Promise.all(
      uniqueWeeks.map(async (weekNumber) => {
        try {
          // Get all days for this week
          const { data: weekDays, error: daysError } = await supabaseAdmin
            .from('training_days')
            .select('id, day_number, day_name, status, is_rest_day, description, created_at')
            .eq('cycle_id', cycleId)
            .eq('week_number', weekNumber)
            .order('day_number', { ascending: true })

          if (daysError) {
            console.error(`❌ Error fetching days for week ${weekNumber}:`, daysError)
            return null
          }

          // For each day, fetch its exercises
          const daysWithExercises = await Promise.all(
            (weekDays || []).map(async (day) => {
              try {
                const { data: exercises, error: exercisesError } = await supabaseAdmin
                  .from('exercises')
                  .select('id, name, sets, reps, weight, rest_time, notes, exercise_order, youtube_video_url')
                  .eq('training_day_id', day.id)
                  .order('exercise_order', { ascending: true })

                if (exercisesError) {
                  console.error(`❌ Error fetching exercises for day ${day.id}:`, exercisesError)
                  return { ...day, exercises: [] }
                }

                // Debug: Check for YouTube videos
                const exercisesWithYouTube = exercises?.filter(ex => ex.youtube_video_url) || []
                if (exercisesWithYouTube.length > 0) {
                  console.log(`🎥 Found ${exercisesWithYouTube.length} exercises with YouTube videos for day ${day.id}:`, 
                    exercisesWithYouTube.map(ex => ({ name: ex.name, youtube_url: ex.youtube_video_url })))
                }

                // For each exercise, fetch its set-specific progress data
                const exercisesWithSetData = await Promise.all(
                  (exercises || []).map(async (exercise) => {
                    try {
                      // Get the client ID for this training program
                      const { data: trainingProgram } = await supabaseAdmin
                        .from('training_programs')
                        .select('client_id')
                        .eq('id', cycleId)
                        .single()

                      if (!trainingProgram?.client_id) {
                        console.error(`❌ No client found for training program ${cycleId}`)
                        return { ...exercise, set_progress: [] }
                      }

                      // Fetch set_progress data for this exercise and client
                      const { data: setProgress, error: setProgressError } = await supabaseAdmin
                        .from('set_progress')
                        .select('set_number, weight, reps, notes, completed_at')
                        .eq('exercise_id', exercise.id)
                        .eq('training_day_id', day.id)
                        .eq('client_id', trainingProgram.client_id)
                        .order('set_number', { ascending: true })

                      if (setProgressError) {
                        console.error(`❌ Error fetching set progress for exercise ${exercise.id}:`, setProgressError)
                        return { ...exercise, set_progress: [] }
                      }

                      return { ...exercise, set_progress: setProgress || [] }
                    } catch (error) {
                      console.error(`❌ Error processing set progress for exercise ${exercise.id}:`, error)
                      return { ...exercise, set_progress: [] }
                    }
                  })
                )

                return { ...day, exercises: exercisesWithSetData || [] }
              } catch (error) {
                console.error(`❌ Error processing exercises for day ${day.id}:`, error)
                return { ...day, exercises: [] }
              }
            })
          )

          const totalDays = daysWithExercises?.length || 0
          const completedDays = daysWithExercises?.filter(day => day.status === 'completed').length || 0
          const isCompleted = totalDays > 0 && completedDays === totalDays
          const isCurrentWeek = weekNumber === Math.min(...uniqueWeeks) // Simple logic - can be enhanced

          return {
            id: `week-${weekNumber}`,
            name: `Week ${weekNumber}`,
            week_number: weekNumber,
            status: isCompleted ? 'completed' : isCurrentWeek ? 'current' : 'upcoming',
            is_completed: isCompleted,
            is_current_week: isCurrentWeek,
            total_days: totalDays,
            completed_days: completedDays,
            days: daysWithExercises || [],
            created_at: new Date().toISOString() // This should come from the database
          }
        } catch (error) {
          console.error(`❌ Error processing week ${weekNumber}:`, error)
          return null
        }
      })
    )

    // Filter out null values and sort by week number
    const validWeeks = weeksWithStatus.filter(week => week !== null).sort((a, b) => a!.week_number - b!.week_number)

    console.log('✅ Successfully fetched weeks:', validWeeks)

    return NextResponse.json({
      weeks: validWeeks,
      cycle: programData
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}) 