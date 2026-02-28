import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth-middleware'

// GET /api/weight-tracker/client-data - Get weight data for client
export const GET = withAuth(async (req) => {
  try {
    // Only allow clients to access this endpoint
    if (req.user.role !== 'client') {
      return NextResponse.json(
        { error: 'Access denied. Client only.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
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

    // Get client data by email
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, trainer_id')
      .eq('email', req.user.email)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Get weight data for this client
    const { data: weightData, error: weightError } = await supabaseAdmin
      .from('body_weight_tracker')
      .select('*')
      .eq('client_id', clientData.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (weightError) {
      console.error('Error fetching weight data:', weightError)
      return NextResponse.json(
        { error: 'Failed to fetch weight data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      weightData: weightData || []
    })
  } catch (error) {
    console.error('Error in GET /api/weight-tracker/client-data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
