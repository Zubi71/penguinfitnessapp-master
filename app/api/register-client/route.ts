import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
      fitnessGoals,
      medicalConditions,
      preferredTime,
      additionalNotes,
      selectedService
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !phone) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use default service if none provided
    const defaultService = selectedService || {
      id: 'basic',
      name: 'Basic Package',
      price: 0,
      description: 'Default starter package'
    }

    // Create Supabase admin client (bypasses RLS)
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

    console.log('🚀 Creating client registration for:', email)

    // Check if email already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const emailExists = existingUser.users.find(user => user.email === email)

    if (emailExists) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      )
    }

    // Create auth user with Supabase (disable email confirmation)
    let authData: any = null
    let authError: any = null

    // Use admin client directly for reliable user creation
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: 'client'
      }
    })

    if (signUpError) {
      console.error('❌ Admin user creation failed:', signUpError)
      return NextResponse.json(
        { message: signUpError.message || 'Failed to create account' },
        { status: 400 }
      )
    }

    authData = signUpData

    if (!authData.user) {
      return NextResponse.json(
        { message: 'Failed to create user account' },
        { status: 400 }
      )
    }

    console.log('✅ Auth user created:', authData.user.id)

    // Create user role entry
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'client'
      })

    if (roleError) {
      console.error('❌ Role insertion error:', roleError)
      // Try to clean up auth user if role creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { message: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    console.log('✅ User role created')

    // Create client profile in client_signups table
    const clientData = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      birthday: dateOfBirth || null,
      gender: gender || null,
      parent_first_name: emergencyContactName || null,
      parent_phone: emergencyContactPhone || null,
      parent_relationship: emergencyContactRelationship || null,
      type_of_lesson: defaultService.name,
      preferred_days: preferredTime ? [preferredTime] : ['flexible'],
      preferred_start_time: preferredTime || 'flexible',
      location: 'main gym',
      medical_conditions: medicalConditions || 'none',
      medical_details: medicalConditions || null,
      additional_notes: additionalNotes || null,
      status: 'confirmed'
    }

    console.log('📝 Creating client record with data:', JSON.stringify(clientData, null, 2))

    // Use admin client to bypass RLS during registration
    const { data: clientRecord, error: clientError } = await supabase
      .from('client_signups')
      .insert(clientData)
      .select()
      .single()

    if (clientError) {
      console.error('❌ Client profile creation error:', clientError)
      
      // Clean up on error
      console.log('🧹 Cleaning up user due to client creation failure...')
      await supabase.auth.admin.deleteUser(authData.user.id)
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', authData.user.id)
      
      return NextResponse.json(
        { message: `Failed to create client profile: ${clientError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Client profile created successfully:', JSON.stringify(clientRecord, null, 2))

    // TODO: Create initial training sessions based on selected service
    // TODO: Send welcome email with service details
    // TODO: Set up payment/billing based on selected service

    console.log('🎉 Client registration completed successfully!')
    console.log(`📊 Created records:`)
    console.log(`  - Auth user: ${authData.user.id}`)
    console.log(`  - User role: client`)
    console.log(`  - Client: ${clientRecord?.id || 'unknown'}`)
    console.log(`  - Selected service: ${selectedService.name}`)

    return NextResponse.json({
      success: true,
      message: 'Client registration successful! Welcome to our fitness program.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: 'client',
        status: 'active'
      },
      client: clientRecord,
      service: selectedService
    })

  } catch (error) {
    console.error('❌ Client registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
