import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware'

// Get user's referral codes
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: referralCodes, error } = await supabase
      .from('referral_codes')
      .select(`
        id,
        code,
        max_uses,
        current_uses,
        points_per_referral,
        is_active,
        expires_at,
        created_at,
        updated_at
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching referral codes:', error)
      return NextResponse.json({ error: 'Failed to fetch referral codes' }, { status: 500 })
    }

    return NextResponse.json({ referralCodes })
  } catch (error) {
    console.error('Referral codes API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// Create new referral code
export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { maxUses, pointsPerReferral = 100, expiresAt, customCode } = body

    // Validate input
    if (maxUses && (maxUses < 1 || maxUses > 1000)) {
      return NextResponse.json({ error: 'Max uses must be between 1 and 1000' }, { status: 400 })
    }

    if (pointsPerReferral < 1 || pointsPerReferral > 10000) {
      return NextResponse.json({ error: 'Points per referral must be between 1 and 10000' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let data, error

    // If custom code is provided, use custom creation function
    if (customCode) {
      const result = await supabase.rpc('create_custom_referral_code', {
        p_user_id: req.user.id,
        p_custom_code: customCode,
        p_max_uses: maxUses || null,
        p_points_per_referral: pointsPerReferral,
        p_expires_at: expiresAt || null
      })

      if (result.error) {
        console.error('Error creating custom referral code:', result.error)
        return NextResponse.json({ error: 'Failed to create custom referral code' }, { status: 500 })
      }

      const resultData = result.data[0]
      if (!resultData.success) {
        return NextResponse.json({ error: resultData.message }, { status: 400 })
      }

      data = resultData.referral_code_id
    } else {
      // Create referral code using the original database function
      const result = await supabase.rpc('create_referral_code', {
        p_user_id: req.user.id,
        p_max_uses: maxUses || null,
        p_points_per_referral: pointsPerReferral,
        p_expires_at: expiresAt || null
      })

      if (result.error) {
        console.error('Error creating referral code:', result.error)
        return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 })
      }

      data = result.data
    }

    // Get the created referral code details
    const { data: referralCode, error: fetchError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('id', data)
      .single()

    if (fetchError) {
      console.error('Error fetching created referral code:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch created referral code' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      referralCode,
      message: customCode ? 'Custom referral code created successfully' : 'Referral code created successfully' 
    })
  } catch (error) {
    console.error('Create referral code API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// Update referral code
export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json()
    const { id, maxUses, pointsPerReferral, isActive, expiresAt } = body

    if (!id) {
      return NextResponse.json({ error: 'Referral code ID is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify ownership
    const { data: existingCode, error: fetchError } = await supabase
      .from('referral_codes')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (fetchError || !existingCode) {
      return NextResponse.json({ error: 'Referral code not found or access denied' }, { status: 404 })
    }

    // Update referral code
    const updateData: any = {}
    if (maxUses !== undefined) updateData.max_uses = maxUses
    if (pointsPerReferral !== undefined) updateData.points_per_referral = pointsPerReferral
    if (isActive !== undefined) updateData.is_active = isActive
    if (expiresAt !== undefined) updateData.expires_at = expiresAt

    const { data: updatedCode, error: updateError } = await supabase
      .from('referral_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating referral code:', updateError)
      return NextResponse.json({ error: 'Failed to update referral code' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      referralCode: updatedCode,
      message: 'Referral code updated successfully' 
    })
  } catch (error) {
    console.error('Update referral code API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

// Delete referral code
export const DELETE = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Referral code ID is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify ownership
    const { data: existingCode, error: fetchError } = await supabase
      .from('referral_codes')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (fetchError || !existingCode) {
      return NextResponse.json({ error: 'Referral code not found or access denied' }, { status: 404 })
    }

    // Delete referral code
    const { error: deleteError } = await supabase
      .from('referral_codes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting referral code:', deleteError)
      return NextResponse.json({ error: 'Failed to delete referral code' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Referral code deleted successfully' 
    })
  } catch (error) {
    console.error('Delete referral code API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})