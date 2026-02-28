import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/auth-middleware'

export const GET = withAuth(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    console.log('🔍 Client by email - Parameters:', {
      email,
      userRole: req.user.role,
      userId: req.user.id,
      userEmail: req.user.email
    })

    if (!email) {
      return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 })
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

    // Get client data by email
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('email', email)
      .single()

    console.log('🔍 Client data by email:', { clientData, clientError })

    if (clientError || !clientData) {
      return NextResponse.json({ 
        error: 'Client not found',
        details: clientError 
      }, { status: 404 })
    }

    // Get user role data for this client
    const { data: userRoleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', clientData.user_id)
      .single()

    console.log('🔍 User role data:', { userRoleData, roleError })

    return NextResponse.json({
      success: true,
      client: {
        ...clientData,
        hasUserRole: !!userRoleData,
        userRole: userRoleData?.role || null
      }
    })

  } catch (error) {
    console.error('Error in client by email API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
