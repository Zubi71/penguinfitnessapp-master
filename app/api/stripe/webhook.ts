import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Invoice } from '@/entities/Invoice'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Create admin client for auto-enrollment operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    console.log(`Received invoice.paid webhook for invoice: ${invoice.id}`)
    
    if (typeof invoice.id === 'string') {
      // Update invoice status
      await Invoice.syncFromStripe(invoice.id, 'paid', new Date().toISOString().split('T')[0])
      
      // Handle auto-enrollment
      await handleAutoEnrollment(invoice.id)
    } else {
      console.error('Stripe invoice.id is not a string:', invoice.id)
    }
  } else if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    console.log(`Received invoice.payment_failed webhook for invoice: ${invoice.id}`)
    
    if (typeof invoice.id === 'string') {
      await Invoice.syncFromStripe(invoice.id, 'overdue')
    } else {
      console.error('Stripe invoice.id is not a string:', invoice.id)
    }
  } else if (event.type === 'invoice.sent') {
    const invoice = event.data.object as Stripe.Invoice
    console.log(`Received invoice.sent webhook for invoice: ${invoice.id}`)
    
    if (typeof invoice.id === 'string') {
      await Invoice.syncFromStripe(invoice.id, 'open')
    } else {
      console.error('Stripe invoice.id is not a string:', invoice.id)
    }
  } else if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    console.log(`Received checkout.session.completed webhook for session: ${session.id}`)
    console.log('Session metadata:', session.metadata)
    
    if (session.metadata?.type === 'community_event_registration') {
      console.log('Processing community event registration payment')
      await handleCommunityEventCheckoutCompleted(session)
    } else if (session.metadata?.invoice_id) {
      console.log('Processing invoice payment')
      await handleCheckoutSessionCompleted(session)
    } else {
      console.log('Unknown checkout session type, metadata:', session.metadata)
    }
  }
  // Add more event types as needed

  return NextResponse.json({ received: true })
}

// Handle auto-enrollment when invoice is paid
async function handleAutoEnrollment(stripeInvoiceId: string) {
  try {
    // Find the local invoice record
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        client_id,
        class_id,
        enrollment_id,
        metadata
      `)
      .eq('stripe_invoice_id', stripeInvoiceId)
      .single()

    if (invoiceError) {
      console.error('Error finding invoice for auto-enrollment:', invoiceError)
      return
    }

    if (!invoice) {
      console.log('No local invoice found for Stripe invoice:', stripeInvoiceId)
      return
    }

    // Handle community event registration
    if (invoice.metadata?.type === 'community_event_registration' && invoice.metadata?.event_id) {
      await handleCommunityEventRegistration(invoice)
      return
    }

    // If this invoice has an enrollment_id, update the enrollment payment status
    if (invoice.enrollment_id) {
      const { error: enrollmentError } = await supabaseAdmin
        .from('class_enrollments')
        .update({ 
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.enrollment_id)

      if (enrollmentError) {
        console.error('Error updating enrollment payment status:', enrollmentError)
      } else {
        console.log(`Auto-enrollment completed for enrollment ${invoice.enrollment_id}`)
        
        // Optionally update client status to 'enrolled' if they were 'confirmed'
        if (invoice.client_id) {
          const { data: client } = await supabaseAdmin
            .from('client_signups')
            .select('status')
            .eq('id', invoice.client_id)
            .single()

          if (client?.status === 'confirmed') {
            await supabaseAdmin
              .from('client_signups')
              .update({ 
                status: 'enrolled',
                updated_at: new Date().toISOString()
              })
              .eq('id', invoice.client_id)
            
            console.log(`Client status updated to 'enrolled' for client ${invoice.client_id}`)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in auto-enrollment process:', error)
  }
}

// Handle community event registration when payment is completed
async function handleCommunityEventRegistration(invoice: any) {
  try {
    const eventId = invoice.metadata.event_id
    const clientId = invoice.client_id

    // Get client user_id
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('user_id')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      console.error('Error finding client for community event registration:', clientError)
      return
    }

    // Check if already registered
    const { data: existingRegistration } = await supabaseAdmin
      .from('community_event_participants')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', client.user_id)
      .single()

    if (existingRegistration) {
      console.log('User already registered for this community event')
      return
    }

         // Register for the event
     const { data: registration, error: registrationError } = await supabaseAdmin
       .from('community_event_participants')
       .insert([{
         event_id: eventId,
         user_id: client.user_id,
         status: 'registered',
         payment_status: 'paid'
       }])
       .select()
       .single()

    if (registrationError) {
      console.error('Error registering for community event:', registrationError)
      return
    }

    // Update event participant count
    const { data: event } = await supabaseAdmin
      .from('community_events')
      .select('current_participants')
      .eq('id', eventId)
      .single()

    if (event) {
      await supabaseAdmin
        .from('community_events')
        .update({ current_participants: event.current_participants + 1 })
        .eq('id', eventId)
    }

    console.log(`Community event registration completed for event ${eventId}, user ${client.user_id}`)
  } catch (error) {
    console.error('Error in community event registration process:', error)
  }
}

// Handle checkout session completion for direct payments
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const invoiceId = session.metadata?.invoice_id
    if (!invoiceId) {
      console.log('No invoice_id in session metadata')
      return
    }

    // Find the local invoice record
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        client_id,
        metadata
      `)
      .eq('stripe_invoice_id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      console.error('Error finding invoice for checkout session:', invoiceError)
      return
    }

    // Update invoice status to paid
    await Invoice.syncFromStripe(invoiceId, 'paid', new Date().toISOString().split('T')[0])

    // Handle community event registration if applicable
    if (invoice.metadata?.type === 'community_event_registration' && invoice.metadata?.event_id) {
      await handleCommunityEventRegistration(invoice)
    }

    console.log(`Checkout session completed for invoice ${invoiceId}`)
  } catch (error) {
    console.error('Error in checkout session completion process:', error)
  }
}

// Handle community event checkout completion
async function handleCommunityEventCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const eventId = session.metadata?.event_id
    const userId = session.metadata?.user_id
    
    console.log(`Processing community event checkout completion for event ${eventId}, user ${userId}`)
    
    if (!eventId || !userId) {
      console.error('Missing event_id or user_id in session metadata')
      return
    }

    // First, check if the registration exists
    const { data: existingRegistration, error: checkError } = await supabaseAdmin
      .from('community_event_participants')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (checkError) {
      console.error('Error checking existing registration:', checkError)
      return
    }

    if (!existingRegistration) {
      console.error('No registration found for event and user')
      return
    }

    console.log(`Found registration with status: ${existingRegistration.status}`)

    // Update registration status to registered
    const { error: updateError } = await supabaseAdmin
      .from('community_event_participants')
      .update({ 
        status: 'registered',
        payment_status: 'paid'
      })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (updateError) {
      console.error('Error updating registration status:', updateError)
      return
    }

    console.log(`Community event registration confirmed for event ${eventId}, user ${userId}`)
  } catch (error) {
    console.error('Error in community event checkout completion process:', error)
  }
}