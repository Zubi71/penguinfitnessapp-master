import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// GET /api/trainer-availability - Get availability
// - Trainer: Gets their own availability
// - Admin: Gets all trainer availability
export async function GET(request: NextRequest) {
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
            // Not needed for reading
          },
        },
      }
    )

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check user role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const dayOfWeek = searchParams.get('day_of_week')
    const time = searchParams.get('time') // Format: "HH:MM" in 24-hour format

    let query = supabaseAdmin
      .from('trainer_availability')
      .select(`
        *,
        trainer:trainers!inner(id, first_name, last_name, email)
      `)

    // If admin, show all. If trainer, show only their own
    if (userRole.role === 'trainer') {
      // Get trainer ID for this user
      const { data: trainer } = await supabaseAdmin
        .from('trainers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!trainer) {
        return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 })
      }

      query = query.eq('trainer_id', trainer.id)
    }

    // Filter by day if provided
    if (dayOfWeek) {
      query = query.eq('day_of_week', dayOfWeek)
    }

    const { data, error } = await query.order('day_of_week', { ascending: true }).order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching availability:', error)
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    let filteredData = data || []

    // Filter by time if provided (for admin view)
    if (time && userRole.role === 'admin' && filteredData.length > 0) {
      const [hours, minutes] = time.split(':').map(Number)
      const queryTimeMinutes = hours * 60 + minutes

      filteredData = filteredData.filter((item: any) => {
        // Free all day (no start_time and no end_time)
        if (!item.start_time && !item.end_time) {
          return true
        }

        // Available from start_time onwards (no end_time)
        if (item.start_time && !item.end_time) {
          const [startHours, startMinutes] = item.start_time.split(':').map(Number)
          const startTimeMinutes = startHours * 60 + startMinutes
          return queryTimeMinutes >= startTimeMinutes
        }

        // Available until end_time (no start_time)
        if (!item.start_time && item.end_time) {
          const [endHours, endMinutes] = item.end_time.split(':').map(Number)
          const endTimeMinutes = endHours * 60 + endMinutes
          return queryTimeMinutes <= endTimeMinutes
        }

        // Time range: query time must be within start_time and end_time
        if (item.start_time && item.end_time) {
          const [startHours, startMinutes] = item.start_time.split(':').map(Number)
          const [endHours, endMinutes] = item.end_time.split(':').map(Number)
          const startTimeMinutes = startHours * 60 + startMinutes
          const endTimeMinutes = endHours * 60 + endMinutes
          return queryTimeMinutes >= startTimeMinutes && queryTimeMinutes <= endTimeMinutes
        }

        return false
      })
    }

    return NextResponse.json(filteredData)
  } catch (error) {
    console.error('Error in availability GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/trainer-availability - Create or update availability
// Only trainers can create/update their own availability
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
            // Not needed for reading
          },
        },
      }
    )

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check user role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    // Only trainers can manage their own availability
    if (userRole.role !== 'trainer') {
      return NextResponse.json({ 
        error: 'Access denied. Trainer role required.' 
      }, { status: 403 })
    }

    // Get trainer ID
    const { data: trainer, error: trainerError } = await supabaseAdmin
      .from('trainers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (trainerError || !trainer) {
      return NextResponse.json({ error: 'Trainer profile not found' }, { status: 404 })
    }

    const availabilityData = await request.json()

    // Validate required fields
    if (!availabilityData.day_of_week) {
      return NextResponse.json({ 
        error: 'Missing required field: day_of_week' 
      }, { status: 400 })
    }

    // Convert times to proper format (add seconds if missing)
    let startTime = availabilityData.start_time
    let endTime = availabilityData.end_time

    if (startTime && !startTime.includes(':')) {
      return NextResponse.json({ error: 'Invalid start_time format' }, { status: 400 })
    }
    if (startTime && startTime.split(':').length === 2) {
      startTime = `${startTime}:00`
    }

    if (endTime && !endTime.includes(':')) {
      return NextResponse.json({ error: 'Invalid end_time format' }, { status: 400 })
    }
    if (endTime && endTime.split(':').length === 2) {
      endTime = `${endTime}:00`
    }

    // Prepare data for upsert
    const upsertData: any = {
      trainer_id: trainer.id,
      day_of_week: availabilityData.day_of_week,
      start_time: startTime || null,
      end_time: endTime || null
    }

    // If updating existing record, include id and use update
    if (availabilityData.id) {
      const { data, error } = await supabaseAdmin
        .from('trainer_availability')
        .update({
          day_of_week: availabilityData.day_of_week,
          start_time: startTime || null,
          end_time: endTime || null
        })
        .eq('id', availabilityData.id)
        .select(`
          *,
          trainer:trainers!inner(id, first_name, last_name, email)
        `)
        .single()

      if (error) {
        console.error('Error updating availability:', error)
        return NextResponse.json({ 
          error: `Failed to update availability: ${error.message}` 
        }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    // For new records, check if a slot with same trainer_id, day, start_time, end_time exists
    // If exists, update it; otherwise insert
    const { data: existing } = await supabaseAdmin
      .from('trainer_availability')
      .select('id')
      .eq('trainer_id', trainer.id)
      .eq('day_of_week', availabilityData.day_of_week)
      .eq('start_time', startTime || null)
      .eq('end_time', endTime || null)
      .maybeSingle()

    if (existing) {
      // Update existing record
      const { data, error } = await supabaseAdmin
        .from('trainer_availability')
        .update({
          day_of_week: availabilityData.day_of_week,
          start_time: startTime || null,
          end_time: endTime || null
        })
        .eq('id', existing.id)
        .select(`
          *,
          trainer:trainers!inner(id, first_name, last_name, email)
        `)
        .single()

      if (error) {
        console.error('Error updating availability:', error)
        return NextResponse.json({ 
          error: `Failed to update availability: ${error.message}` 
        }, { status: 500 })
      }

      return NextResponse.json(data)
    }

    // Insert new record
    const { data, error } = await supabaseAdmin
      .from('trainer_availability')
      .insert(upsertData)
      .select(`
        *,
        trainer:trainers!inner(id, first_name, last_name, email)
      `)
      .single()

    if (error) {
      console.error('Error creating/updating availability:', error)
      return NextResponse.json({ 
        error: `Failed to save availability: ${error.message}` 
      }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in availability POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
