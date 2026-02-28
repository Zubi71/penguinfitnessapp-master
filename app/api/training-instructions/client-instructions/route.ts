import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth-middleware'

// Optimized endpoint for client instructions - single API call
export const GET = withAuth(async (req) => {
  try {
    // Only allow clients to access this endpoint
    if (req.user.role !== 'client') {
      return NextResponse.json(
        { error: 'Access denied. Client only.' },
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

    // Get client data by email
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('email', req.user.email)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Get instructions for this client
    const { data: instructions, error: instructionsError } = await supabaseAdmin
      .from('training_instructions')
      .select('*')
      .eq('client_id', clientData.id)
      .order('created_at', { ascending: false })

    if (instructionsError) {
      console.error('Error fetching instructions:', instructionsError)
      return NextResponse.json(
        { error: 'Failed to fetch instructions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      instructions: instructions || [],
      user: {
        email: req.user.email,
        role: req.user.role
      }
    })
  } catch (error) {
    console.error('Error in GET /api/training-instructions/client-instructions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
