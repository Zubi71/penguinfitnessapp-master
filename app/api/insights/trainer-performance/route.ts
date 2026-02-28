import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/insights/trainer-performance
 * Gets trainer performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const trainerId = searchParams.get('trainer_id')
    const days = parseInt(searchParams.get('days') || '30', 10)

    const periodStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const periodEnd = new Date()

    // Get trainer performance metrics
    let query = supabase
      .from('trainer_performance_metrics')
      .select(`
        *,
        trainer:auth.users(
          id,
          email,
          raw_user_meta_data
        )
      `)
      .gte('measurement_period_end', periodStart.toISOString().split('T')[0])
      .lte('measurement_period_start', periodEnd.toISOString().split('T')[0])
      .order('measurement_period_start', { ascending: false })

    if (trainerId) {
      query = query.eq('trainer_id', trainerId)
    }

    const { data: metrics, error } = await query

    if (error) {
      console.error('Error fetching trainer performance:', error)
      return NextResponse.json({ error: 'Failed to fetch trainer performance' }, { status: 500 })
    }

    // If no metrics exist, calculate them
    if (!metrics || metrics.length === 0) {
      // Calculate metrics for all trainers or specific trainer
      const trainers = trainerId 
        ? [{ id: trainerId }]
        : await getTrainers(supabase)

      const calculatedMetrics = []
      for (const trainer of trainers) {
        const trainerMetrics = await calculateTrainerMetrics(trainer.id, periodStart, periodEnd, supabase)
        if (trainerMetrics) {
          calculatedMetrics.push(trainerMetrics)
        }
      }

      return NextResponse.json({
        success: true,
        period_days: days,
        metrics: calculatedMetrics
      })
    }

    return NextResponse.json({
      success: true,
      period_days: days,
      metrics: metrics || []
    })

  } catch (error) {
    console.error('Error in trainer performance API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getTrainers(supabase: any) {
  const { data: trainers } = await supabase
    .from('trainers')
    .select('user_id')
  
  return trainers?.map((t: any) => ({ id: t.user_id })) || []
}

async function calculateTrainerMetrics(
  trainerId: string,
  periodStart: Date,
  periodEnd: Date,
  supabase: any
) {
  try {
    // Get classes for this trainer in the period
    const { data: classes } = await supabase
      .from('classes')
      .select(`
        *,
        enrollments:class_enrollments(
          *,
          attendance:attendance(*)
        )
      `)
      .eq('instructor_id', trainerId) // Assuming instructor_id maps to trainer
      .gte('date', periodStart.toISOString().split('T')[0])
      .lte('date', periodEnd.toISOString().split('T')[0])

    if (!classes || classes.length === 0) {
      return null
    }

    const totalClasses = classes.length
    const completedClasses = classes.filter((c: any) => c.status === 'completed').length
    const cancelledClasses = classes.filter((c: any) => c.status === 'cancelled').length
    const cancellationRate = totalClasses > 0 ? (cancelledClasses / totalClasses) * 100 : 0

    // Calculate attendance rate
    let totalAttendance = 0
    let presentCount = 0
    classes.forEach((cls: any) => {
      cls.enrollments?.forEach((enrollment: any) => {
        enrollment.attendance?.forEach((att: any) => {
          totalAttendance++
          if (att.status === 'present') {
            presentCount++
          }
        })
      })
    })
    const averageAttendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0

    // Calculate revenue
    const revenueGenerated = classes
      .filter((c: any) => c.status === 'completed')
      .reduce((sum: number, c: any) => sum + parseFloat(c.price || 0), 0)

    // Get feedback scores
    const { data: feedback } = await supabase
      .from('feedback')
      .select('rating')
      .eq('trainer_id', trainerId)
      .gte('created_at', periodStart.toISOString())

    const avgRating = feedback && feedback.length > 0
      ? feedback.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / feedback.length
      : null

    const metrics = {
      trainer_id: trainerId,
      measurement_period_start: periodStart.toISOString().split('T')[0],
      measurement_period_end: periodEnd.toISOString().split('T')[0],
      total_classes: totalClasses,
      completed_classes: completedClasses,
      cancelled_classes: cancelledClasses,
      cancellation_rate: parseFloat(cancellationRate.toFixed(2)),
      average_attendance_rate: parseFloat(averageAttendanceRate.toFixed(2)),
      client_satisfaction_score: avgRating ? parseFloat((avgRating / 5).toFixed(2)) : null,
      revenue_generated: revenueGenerated
    }

    // Upsert metrics
    await supabase
      .from('trainer_performance_metrics')
      .upsert(metrics, {
        onConflict: 'trainer_id,measurement_period_start,measurement_period_end'
      })

    return metrics
  } catch (error) {
    console.error('Error calculating trainer metrics:', error)
    return null
  }
}

