import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

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

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent, supabase)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent, supabase)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSuccess(event.data.object as Stripe.Invoice, supabase)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  const { event_id, user_id, payment_type } = paymentIntent.metadata

  // Update payment status
  await supabase
    .from('stripe_payments')
    .update({ 
      status: 'succeeded',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (payment_type === 'event_registration') {
    // Register user for event
    const { error: registrationError } = await supabase
      .from('community_event_participants')
      .insert({
        event_id: event_id,
        user_id: user_id,
        status: 'registered',
        registration_date: new Date().toISOString()
      })

    if (registrationError) {
      console.error('Error registering user for event:', registrationError)
      return
    }

    // Update event participant count
    await supabase.rpc('increment_event_participants', { event_id: event_id })

    // Award points to user
    const { data: event } = await supabase
      .from('community_events')
      .select('points_reward, title')
      .eq('id', event_id)
      .single()

    if (event && event.points_reward) {
      await supabase.rpc('add_client_points', {
        p_client_id: user_id,
        p_points: event.points_reward,
        p_description: `Points earned for registering to ${event.title}`,
        p_reference_type: 'event_registration',
        p_reference_id: event_id
      })
    }

    // Check if user qualifies for rewards
    await checkAndAwardRewards(user_id, supabase)
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  // Update payment status
  await supabase
    .from('stripe_payments')
    .update({ 
      status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)
}

async function handleInvoicePaymentSuccess(invoice: Stripe.Invoice, supabase: any) {
  // Update payment status if invoice payment succeeds
  const paymentIntent = (invoice as any).payment_intent
  if (paymentIntent && typeof paymentIntent === 'string') {
    await supabase
      .from('stripe_payments')
      .update({ 
        status: 'succeeded',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntent)
  }
}

async function checkAndAwardRewards(userId: string, supabase: any) {
  // Get user's total points earned
  const { data: pointsData } = await supabase
    .from('client_points')
    .select('total_points_earned')
    .eq('client_id', userId)
    .single()

  if (!pointsData) return

  const totalPoints = pointsData.total_points_earned

  // Award rewards based on milestone achievements
  const milestones = [
    { points: 500, reward: { type: 'discount_percentage', value: 10, description: '10% discount on next event' } },
    { points: 1000, reward: { type: 'discount_percentage', value: 15, description: '15% discount on next event' } },
    { points: 2000, reward: { type: 'discount_percentage', value: 20, description: '20% discount on next event' } },
    { points: 5000, reward: { type: 'free_event', value: 0, description: 'Free event registration' } }
  ]

  for (const milestone of milestones) {
    if (totalPoints >= milestone.points) {
      // Check if reward already exists
      const { data: existingReward } = await supabase
        .from('client_rewards')
        .select('id')
        .eq('client_id', userId)
        .eq('reward_type', milestone.reward.type)
        .eq('reward_value', milestone.reward.value)
        .eq('description', milestone.reward.description)
        .single()

      if (!existingReward) {
        // Award new reward
        await supabase
          .from('client_rewards')
          .insert({
            client_id: userId,
            reward_type: milestone.reward.type,
            reward_value: milestone.reward.value,
            description: milestone.reward.description,
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year expiry
          })
      }
    }
  }
}
