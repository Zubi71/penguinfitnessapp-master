import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/insights/feedback-analysis
 * Gets feedback analysis using existing feedback data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or trainer
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'trainer')) {
      return NextResponse.json({ error: 'Admin or trainer access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)

    // Use database function to bypass RLS issues
    const { data: feedback, error } = await supabase.rpc('get_feedback_analysis', {
      p_days: days
    })

    if (error) {
      console.error('Error fetching feedback:', error)
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
    }

    // Analyze feedback
    const totalFeedback = feedback?.length || 0
    
    // Calculate sentiment distribution
    const bySentiment = {
      positive: feedback?.filter((f: any) => f.ai_sentiment === 'positive').length || 0,
      neutral: feedback?.filter((f: any) => f.ai_sentiment === 'neutral').length || 0,
      negative: feedback?.filter((f: any) => f.ai_sentiment === 'negative').length || 0
    }

    // Calculate average rating
    const ratings = feedback?.filter((f: any) => f.rating).map((f: any) => f.rating) || []
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length
      : 0

    // Get recent feedback with text
    const recentFeedback = feedback
      ?.filter((f: any) => f.text_feedback || f.rating)
      .slice(0, 10)
      .map((f: any) => ({
        id: f.id,
        rating: f.rating || null,
        text_feedback: f.text_feedback || null,
        ai_sentiment: f.ai_sentiment || 'neutral',
        created_at: f.created_at
      })) || []

    return NextResponse.json({
      success: true,
      total_feedback: totalFeedback,
      by_sentiment: bySentiment,
      average_rating: averageRating,
      recent_feedback: recentFeedback
    })

  } catch (error) {
    console.error('Error in feedback analysis API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

