import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// GET /api/trainers - List all trainers
export async function GET() {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // Not needed for reading, but required by the interface
          },
        },
      }
    )

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🔐 Auth check - User:', user?.id, 'Email:', user?.email)
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check user role
    console.log('🔍 Looking up user role for user_id:', user.id)
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    console.log('👤 User role query result:', { userRole, roleError })

    if (roleError || !userRole) {
      console.error('❌ User role not found:', roleError)
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    // Allow admin and trainer access
    if (!['admin', 'trainer'].includes(userRole.role)) {
      console.error('🚫 Access denied for role:', userRole.role)
      return NextResponse.json({ 
        error: 'Access denied. Admin or trainer role required.' 
      }, { status: 403 })
    }

    console.log(`🔍 Fetching trainers for user role: ${userRole.role}`)

    // Create admin client to bypass RLS for debugging
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First, let's check all tables to see what data exists
    console.log('🔍 DEBUG: Checking all trainer-related tables...')
    
    // Check trainers table with admin client (bypass RLS)
    const { data: trainersAdmin, error: trainersAdminError } = await supabaseAdmin
      .from('trainers')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('📊 ADMIN CLIENT - Trainers table:', { 
      data: trainersAdmin, 
      error: trainersAdminError, 
      count: trainersAdmin?.length 
    })

    // Check trainers_legacy table
    const { data: legacyAdmin, error: legacyAdminError } = await supabaseAdmin
      .from('trainers_legacy')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('📊 ADMIN CLIENT - Trainers_legacy table:', { 
      data: legacyAdmin, 
      error: legacyAdminError, 
      count: legacyAdmin?.length 
    })

    // Check if coaches table still exists
    const { data: coachesAdmin, error: coachesAdminError } = await supabaseAdmin
      .from('coaches')
      .select('*')
      .order('created_at', { ascending: false })
    
    console.log('📊 ADMIN CLIENT - Coaches table (if exists):', { 
      data: coachesAdmin, 
      error: coachesAdminError, 
      count: coachesAdmin?.length 
    })

    // Check user_roles table to see current user
    const { data: allRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
    
    console.log('📊 ADMIN CLIENT - User roles for current user:', { 
      data: allRoles, 
      error: rolesError 
    })

    // Fetch trainers - get all trainers for admin, or specific trainer for trainer role
    let query = supabase.from('trainers').select('*');
    
    // If user is a trainer (not admin), they might only see their own record
    // But for now, let's allow trainers to see all trainers for management
    if (userRole.role === 'trainer') {
      console.log('👤 Trainer accessing - showing all trainers for management');
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })

    console.log('📊 Database query result:', { data, error, count: data?.length })

    if (error) {
      console.error('Database error fetching trainers:', error)
      return NextResponse.json({ error: 'Failed to fetch trainers' }, { status: 500 })
    }

    console.log(`✅ Found ${data?.length || 0} trainers for user role: ${userRole.role}`)
    
    // Log each trainer for debugging
    if (data && data.length > 0) {
      console.log('📋 Trainer details:')
      data.forEach((trainer, index) => {
        console.log(`  ${index + 1}. ${trainer.first_name} ${trainer.last_name} (${trainer.email}) - ID: ${trainer.id} - User ID: ${trainer.user_id}`)
      })
    } else {
      console.log('📋 No trainers found in trainers table')
      
      // AUTO-FIX: Check if there are any users with trainer role who don't have trainer records
      console.log('🔧 AUTO-FIX: Checking for users with trainer role but no trainer records...')
      
      const { data: trainerUsers, error: trainerUsersError } = await supabaseAdmin
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'trainer')
      
      console.log('� Users with trainer role:', trainerUsers?.length || 0)
      
      if (trainerUsers && trainerUsers.length > 0) {
        // Get auth user details for each trainer role user
        const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()
        
        for (const trainerUser of trainerUsers) {
          // Check if this user already has a trainer record
          const { data: existingTrainer } = await supabaseAdmin
            .from('trainers')
            .select('id')
            .eq('user_id', trainerUser.user_id)
            .single()
          
          if (!existingTrainer) {
            // Find the auth user details
            const authUser = authUsers?.find(u => u.id === trainerUser.user_id)
            if (authUser) {
              console.log(`🔧 Creating missing trainer record for ${authUser.email}...`)
              
              const firstName = authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || 'Trainer'
              const lastName = authUser.user_metadata?.last_name || 'User'
              
              const { data: newTrainer, error: createError } = await supabaseAdmin
                .from('trainers')
                .insert([{
                  user_id: authUser.id,
                  first_name: firstName,
                  last_name: lastName,
                  email: authUser.email,
                  phone: authUser.user_metadata?.phone || null,
                  hire_date: new Date().toISOString().split('T')[0]
                }])
                .select()
                .single()

              if (createError) {
                console.error(`❌ Failed to auto-create trainer record for ${authUser.email}:`, createError)
              } else {
                console.log(`✅ Auto-created trainer record for ${authUser.email}:`, newTrainer)
              }
            }
          }
        }
        
        // Re-fetch trainers after auto-creation
        const { data: updatedTrainers, error: refetchError } = await supabaseAdmin
          .from('trainers')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (updatedTrainers && updatedTrainers.length > 0) {
          console.log(`✅ After auto-fix, found ${updatedTrainers.length} trainers`)
          return NextResponse.json(updatedTrainers)
        }
      }
      
      // If we have data in trainers_legacy or coaches, let's return that
      if (legacyAdmin && legacyAdmin.length > 0) {
        console.log('✅ Found trainers in trainers_legacy table, returning those instead')
        console.log('📋 Legacy trainer details:')
        legacyAdmin.forEach((trainer, index) => {
          console.log(`  ${index + 1}. ${trainer.first_name} ${trainer.last_name} (${trainer.email}) - ID: ${trainer.id}`)
        })
        return NextResponse.json(legacyAdmin)
      }
      
      if (coachesAdmin && coachesAdmin.length > 0) {
        console.log('✅ Found trainers in coaches table, returning those instead')
        console.log('📋 Coach trainer details:')
        coachesAdmin.forEach((trainer, index) => {
          console.log(`  ${index + 1}. ${trainer.first_name} ${trainer.last_name} (${trainer.email}) - ID: ${trainer.id}`)
        })
        return NextResponse.json(coachesAdmin)
      }
      
      console.log('❌ No trainer data found in any table')
    }
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in trainers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/trainers - Create a new trainer
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // Not needed for reading, but required by the interface
          },
        },
      }
    )

    // Create admin client for operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check user role (using admin client to bypass RLS)
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    // Only allow admin access for creating trainers
    if (userRole.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Access denied. Admin role required.' 
      }, { status: 403 })
    }

    const trainerData = await request.json()

    // Validate required fields
    if (!trainerData.first_name || !trainerData.last_name || !trainerData.email) {
      return NextResponse.json({ 
        error: 'Missing required fields: first_name, last_name, email' 
      }, { status: 400 })
    }

    // Create trainer using admin client
    const { data, error } = await supabaseAdmin
      .from('trainers')
      .insert([trainerData])
      .select()
      .single()

    if (error) {
      console.error('Error creating trainer:', error)
      return NextResponse.json({ 
        error: `Failed to create trainer: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in trainers POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
