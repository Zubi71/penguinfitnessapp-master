import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth-middleware'

// GET /api/training-instructions?clientId=xxx - Get instructions for a client
export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
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

    // Different behavior for trainers vs clients
    let query = supabaseAdmin.from('training_instructions').select('*')

    if (req.user.role === 'trainer') {
      // Trainers can see instructions for their clients
      query = query
        .eq('trainer_id', req.user.id)
        .eq('client_id', clientId)
    } else if (req.user.role === 'client') {
      // Clients can only see their own instructions
      const { data: clientData, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('email', req.user.email)
        .single()

      if (clientError || !clientData) {
        console.error('❌ Client not found for email:', req.user.email, clientError)
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        )
      }

      console.log('🔍 Client data:', clientData, 'Requested clientId:', clientId)

      if (clientData.id !== clientId) {
        console.error('❌ Client ID mismatch:', clientData.id, 'vs', clientId)
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      query = query.eq('client_id', clientId)
    } else {
      console.error('❌ Unauthorized role:', req.user.role)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { data: instructions, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching instructions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch instructions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ instructions })
  } catch (error) {
    console.error('Error in GET /api/training-instructions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// POST /api/training-instructions - Create new instruction (trainers only)
export const POST = withAuth(async (req) => {
  try {
    if (req.user.role !== 'trainer') {
      return NextResponse.json(
        { error: 'Only trainers can create instructions' },
        { status: 403 }
      )
    }

    const { clientId, title, content } = await req.json()

    if (!clientId || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Verify the client belongs to this trainer
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('trainer_id', req.user.id)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: 'Client not found or unauthorized' },
        { status: 404 }
      )
    }

    // Create the instruction
    const { data: instruction, error } = await supabaseAdmin
      .from('training_instructions')
      .insert([
        {
          trainer_id: req.user.id,
          client_id: clientId,
          title: title.trim(),
          content: content.trim()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating instruction:', error)
      return NextResponse.json(
        { error: 'Failed to create instruction' },
        { status: 500 }
      )
    }

    return NextResponse.json({ instruction })
  } catch (error) {
    console.error('Error in POST /api/training-instructions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// DELETE /api/training-instructions - Delete instruction (trainers only)
export const DELETE = withAuth(async (req) => {
  try {
    if (req.user.role !== 'trainer') {
      return NextResponse.json(
        { error: 'Only trainers can delete instructions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const instructionId = searchParams.get('id')

    if (!instructionId) {
      return NextResponse.json(
        { error: 'Instruction ID is required' },
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

    // Delete the instruction (RLS will ensure only trainer's instructions can be deleted)
    const { error } = await supabaseAdmin
      .from('training_instructions')
      .delete()
      .eq('id', instructionId)
      .eq('trainer_id', req.user.id)

    if (error) {
      console.error('Error deleting instruction:', error)
      return NextResponse.json(
        { error: 'Failed to delete instruction' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/training-instructions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})
