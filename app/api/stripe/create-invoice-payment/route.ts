import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

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
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId } = body

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Get the invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('stripe_invoice_id', invoiceId)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Verify the invoice belongs to the current user
    const { data: userProfile } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!userProfile || invoice.client_id !== userProfile.id) {
      return NextResponse.json({ error: 'Unauthorized access to invoice' }, { status: 403 })
    }

    // Create Stripe checkout session for the invoice
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: invoice.description || 'Event Registration',
            },
            unit_amount: Math.round(invoice.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/client/community-events?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/client/community-events?payment=cancelled`,
      metadata: {
        invoice_id: invoiceId,
        event_id: invoice.metadata?.event_id,
        user_id: user.id,
        client_id: userProfile.id
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating invoice payment session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
