import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if event exists and is active
    const { data: event, error: eventError } = await supabase
      .from('community_events')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single()
    
    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found or not active' }, { status: 404 })
    }
    
    // Check if event is full
    if (event.max_participants && event.current_participants >= event.max_participants) {
      return NextResponse.json({ error: 'Event is full' }, { status: 400 })
    }
    
    // Check if user is already registered
    const { data: existingRegistration, error: checkError } = await supabase
      .from('community_event_participants')
      .select('id, status')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .single()
    
    if (existingRegistration) {
      // If already registered and confirmed, return error
      if (existingRegistration.status === 'registered') {
        return NextResponse.json({ error: 'Already registered for this event' }, { status: 400 })
      }
      // If pending, allow them to proceed (they might be retrying payment)
      console.log('User has pending registration, allowing retry')
    }

    // Get user profile
    const { data: userProfile, error: userError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Handle free events - register directly
    if (event.price === 0) {
              const { data, error } = await supabase
          .from('community_event_participants')
          .insert([{
            event_id: id,
            user_id: user.id,
            status: 'registered'
          }])
          .select()
          .single()
      
      if (error) {
        console.error('Error registering for event:', error)
        return NextResponse.json({ error: 'Failed to register for event' }, { status: 500 })
      }
      
      // Update event participant count
      await supabase
        .from('community_events')
        .update({ current_participants: event.current_participants + 1 })
        .eq('id', id)
      
      return NextResponse.json({ registration: data, status: 'confirmed' }, { status: 201 })
    }

    // Handle paid events - create checkout session
    try {
      // Create or get Stripe customer
      let customerId = userProfile.stripe_customer_id
      
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${userProfile.first_name} ${userProfile.last_name}`,
          metadata: {
            user_id: user.id,
            client_id: userProfile.id
          }
        })
        
        customerId = customer.id
        
        // Update user profile with Stripe customer ID
        await supabase
          .from('clients')
          .update({ stripe_customer_id: customerId })
          .eq('id', userProfile.id)
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Registration for ${event.title}`,
                description: event.description || 'Community event registration'
              },
              unit_amount: Math.round(event.price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${request.nextUrl.origin}/client/community-events?payment=success&session_id={CHECKOUT_SESSION_ID}&event_id=${event.id}`,
        cancel_url: `${request.nextUrl.origin}/client/community-events?payment=cancelled`,
        metadata: {
          event_id: event.id,
          event_title: event.title,
          user_id: user.id,
          client_id: userProfile.id,
          type: 'community_event_registration'
        }
      })

      // Register for event with pending status
      let data, error
      
      // Try to insert new registration
      const insertResult = await supabase
        .from('community_event_participants')
        .insert([{
          event_id: id,
          user_id: user.id,
          status: 'pending'
        }])
        .select()
        .single()
      
      data = insertResult.data
      error = insertResult.error
      
      // If duplicate key error, try to update existing pending registration
      if (error && error.code === '23505') {
        console.log('Duplicate registration detected, updating existing record')
        const updateResult = await supabase
          .from('community_event_participants')
          .update({ status: 'pending' })
          .eq('event_id', id)
          .eq('user_id', user.id)
          .select()
          .single()
        
        data = updateResult.data
        error = updateResult.error
      }
      
      if (error) {
        console.error('Error registering for event:', error)
        return NextResponse.json({ error: 'Failed to register for event' }, { status: 500 })
      }
      
      // Update event participant count
      await supabase
        .from('community_events')
        .update({ current_participants: event.current_participants + 1 })
        .eq('id', id)
      
      return NextResponse.json({ 
        registration: data, 
        checkout_url: session.url,
        status: 'pending'
      }, { status: 201 })

    } catch (stripeError) {
      console.error('Stripe error:', stripeError)
      return NextResponse.json({ 
        error: 'Payment setup failed. Please try again or contact support.' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in POST /api/community-events/[id]/register:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is registered for this event
    const { data: registration, error: checkError } = await supabase
      .from('community_event_participants')
      .select('id')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .single()
    
    if (checkError || !registration) {
      return NextResponse.json({ error: 'Not registered for this event' }, { status: 404 })
    }
    
    // Cancel registration
    const { error } = await supabase
      .from('community_event_participants')
      .delete()
      .eq('id', registration.id)
    
    if (error) {
      console.error('Error canceling registration:', error)
      return NextResponse.json({ error: 'Failed to cancel registration' }, { status: 500 })
    }
    
    // Update event participant count
    const { data: event } = await supabase
      .from('community_events')
      .select('current_participants')
      .eq('id', id)
      .single()
    
    if (event) {
      await supabase
        .from('community_events')
        .update({ current_participants: Math.max(0, event.current_participants - 1) })
        .eq('id', id)
    }
    
    return NextResponse.json({ message: 'Registration cancelled successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/community-events/[id]/register:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
