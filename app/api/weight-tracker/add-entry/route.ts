import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth-middleware'

// POST /api/weight-tracker/add-entry - Add weight entry for client
export const POST = withAuth(async (req) => {
  try {
    // Only allow clients to access this endpoint
    if (req.user.role !== 'client') {
      return NextResponse.json(
        { error: 'Access denied. Client only.' },
        { status: 403 }
      )
    }

    const { weight, date, notes } = await req.json()

    if (!weight || !date) {
      return NextResponse.json(
        { error: 'Weight and date are required' },
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

    // Check if entry already exists for this date
    const { data: existingEntry, error: checkError } = await supabaseAdmin
      .from('body_weight_tracker')
      .select('id')
      .eq('client_id', clientData.id)
      .eq('date', date)
      .single()

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Weight entry for this date already exists' },
        { status: 409 }
      )
    }

    // Add the weight entry
    const { data: newEntry, error: insertError } = await supabaseAdmin
      .from('body_weight_tracker')
      .insert([
        {
          client_id: clientData.id,
          trainer_id: clientData.trainer_id, // Use the client's assigned trainer
          weight: Number(weight),
          date: date,
          notes: notes || null
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Error adding weight entry:', insertError)
      return NextResponse.json(
        { error: 'Failed to add weight entry' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      entry: newEntry
    })
  } catch (error) {
    console.error('Error in POST /api/weight-tracker/add-entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
