import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Test if service role key is working
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Test admin operations
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Service role test failed:', listError)
      return NextResponse.json({
        success: false,
        error: 'Service role key not working',
        details: listError.message
      }, { status: 500 })
    }

    // Test database access
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1)

    if (rolesError) {
      console.error('❌ Database access test failed:', rolesError)
      return NextResponse.json({
        success: false,
        error: 'Database access failed',
        details: rolesError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Service role key is working properly',
      userCount: users.users.length,
      canAccessDatabase: true
    })

  } catch (error: any) {
    console.error('❌ Service role test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Service role test failed',
      details: error.message
    }, { status: 500 })
  }
}

