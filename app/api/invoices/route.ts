import { NextRequest, NextResponse } from 'next/server'
import { Invoice } from '@/entities/Invoice'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const invoiceSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  class_id: z.string().uuid('Invalid class ID').optional(),
  enrollment_id: z.string().uuid('Invalid enrollment ID').optional(),
  invoice_number: z.string().optional(),
  amount: z.number().min(0),
  tax_amount: z.number().min(0).optional(),
  total_amount: z.number().min(0).optional(),
  due_date: z.string(),
  description: z.string().optional(),
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    unit_price: z.number().min(0),
    total: z.number().min(0)
  })).optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional()
})

// Create admin client for bypassing RLS
const getAdminClient = () => {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/invoices - List invoices
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use admin client to check user role
    const adminClient = getAdminClient();
    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'trainer')) {
      return NextResponse.json({ 
        error: 'Access denied. Admin or trainer role required for invoice management.' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url)
    const client_id = searchParams.get('client_id')
    
    // Use admin client to fetch invoices directly (bypass RLS)
    let query = adminClient
      .from('invoices')
      .select(`
        *,
        client:client_signups(id, first_name, last_name, email)
      `)
      .order('created_at', { ascending: false })
    
    // Apply role-based filtering
    if (userRole.role === 'client') {
      query = query.eq('client_id', user.id)
    } else if (userRole.role === 'trainer') {
      // Trainers can see invoices they created or for their clients
      if (client_id) {
        query = query.eq('client_id', client_id)
      }
      // Note: We could add additional filtering here to only show invoices 
      // created by this trainer, but for now trainers can see all invoices
    } else if (client_id) {
      // Admins can filter by client_id if provided
      query = query.eq('client_id', client_id)
    }
    
    const { data: invoices, error } = await query
    
    if (error) {
      console.error('Error fetching invoices:', error)
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
    }
    
    console.log(`Found ${invoices?.length || 0} invoices for user role: ${userRole.role}`)
    return NextResponse.json(invoices || [])
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

// POST /api/invoices - Create invoice
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use admin client to check user role
    const adminClient = getAdminClient();
    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'trainer')) {
      return NextResponse.json({ 
        error: 'Access denied. Admin or trainer role required for invoice creation.' 
      }, { status: 403 });
    }

    const body = await request.json()
    console.log('Invoice creation request body:', body)
    
    // Validate amount before processing
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ 
        error: 'Invalid amount: Invoice amount must be greater than 0. Please set a price for the class.' 
      }, { status: 400 });
    }
    
    const validatedData = invoiceSchema.parse(body)
    console.log('Validated invoice data:', validatedData)

    // Fetch client info for Stripe using admin client
    const { data: client, error: clientError } = await adminClient
      .from('client_signups')
      .select('first_name, last_name, email')
      .eq('id', validatedData.client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found for Stripe invoice' }, { status: 400 });
    }

    // Generate invoice number (not in validation schema)
    let invoiceNumber: string;
    if (body.invoice_number) {
      invoiceNumber = body.invoice_number;
    } else {
      const { count } = await adminClient
        .from('invoices')
        .select('*', { count: 'exact', head: true });
      
      // Generate custom invoice number: PFI(year)/MM/001
      const now = new Date();
      const year = String(now.getFullYear()).slice(-2); // Last 2 digits of year (25 for 2025)
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Month with leading zero
      const sequence = String((count || 0) + 1).padStart(3, '0'); // 3-digit sequence number
      
      invoiceNumber = `PFI${year}/${month}/${sequence}`;
    }

    // Prepare invoice data for database (exclude joined fields)
    const dbInvoiceData: any = {
      client_id: validatedData.client_id,
      class_id: validatedData.class_id,
      enrollment_id: validatedData.enrollment_id,
      invoice_number: invoiceNumber,
      amount: validatedData.amount,
      tax_amount: validatedData.tax_amount || 0,
      total_amount: validatedData.total_amount || validatedData.amount,
      currency: 'SGD',
      status: 'sent', // Set to 'sent' since we're sending it via Stripe
      due_date: validatedData.due_date,
      description: validatedData.description,
      line_items: validatedData.line_items,
      created_by: user.id
    };

    // Create Stripe integration if needed
    let stripeInvoiceId: string | undefined;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

    if (stripe) {
      try {
        // 1. Create or find Stripe customer
        let stripeCustomerId: string;
        const customers = await stripe.customers.list({ email: client.email, limit: 1 });
        
        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id;
        } else {
          const customer = await stripe.customers.create({
            email: client.email,
            name: `${client.first_name} ${client.last_name}`
          });
          stripeCustomerId = customer.id;
        }

        // 2. Create Stripe invoice with line items directly
        console.log(`Creating Stripe invoice for amount: ${dbInvoiceData.total_amount} SGD (${Math.round(dbInvoiceData.total_amount * 100)} cents)`);
        
        const stripeInvoice = await stripe.invoices.create({
          customer: stripeCustomerId,
          auto_advance: false, // We'll manually finalize and send
          collection_method: 'send_invoice',
          days_until_due: 30, // Set payment terms
          currency: 'sgd',
          number: invoiceNumber, // Set custom invoice number in Stripe
          description: dbInvoiceData.description || 'Swim School Invoice',
          metadata: { local_invoice_number: invoiceNumber }
        });

        // 3. Add invoice item to the created invoice
        await stripe.invoiceItems.create({
          customer: stripeCustomerId,
          invoice: stripeInvoice.id, // Explicitly attach to the invoice
          amount: Math.round(dbInvoiceData.total_amount * 100), // in cents
          currency: 'sgd',
          description: dbInvoiceData.description || 'Swim School Invoice'
        });

        if (!stripeInvoice.id) {
          throw new Error('Failed to create Stripe invoice - no ID returned');
        }

        // 4. Finalize the invoice (converts from draft to open)
        console.log(`Finalizing Stripe invoice ${stripeInvoice.id}`);
        await stripe.invoices.finalizeInvoice(stripeInvoice.id);

        // 5. Send the invoice to the customer
        console.log(`Sending Stripe invoice ${stripeInvoice.id} to ${client.email}`);
        await stripe.invoices.sendInvoice(stripeInvoice.id);

        stripeInvoiceId = stripeInvoice.id;
        console.log(`Stripe invoice ${stripeInvoice.id} created, finalized, and sent to ${client.email}`);
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        // Continue without Stripe integration
      }
    }

    // Add Stripe invoice ID if created
    if (stripeInvoiceId) {
      dbInvoiceData.stripe_invoice_id = stripeInvoiceId;
    }

    // Create invoice in database using admin client (bypasses RLS)
    const { data: invoice, error } = await adminClient
      .from('invoices')
      .insert([dbInvoiceData])
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      return NextResponse.json({ 
        error: `Failed to create invoice: ${error.message}` 
      }, { status: 500 });
    }

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}

// PUT /api/invoices?id=... - Update invoice
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use admin client to check user role
    const adminClient = getAdminClient();
    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'trainer')) {
      return NextResponse.json({ error: 'Forbidden: Only admin or trainer can update invoices' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing invoice id' }, { status: 400 })
    }

    const body = await request.json()
    console.log(`Updating invoice ${id} with data:`, body)
    
    // Use admin client to update invoice directly (bypass RLS)
    const { data: invoice, error } = await adminClient
      .from('invoices')
      .update(body)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating invoice:', error)
      return NextResponse.json({ 
        error: `Failed to update invoice: ${error.message}` 
      }, { status: 500 })
    }
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    
    console.log(`Successfully updated invoice ${id}`)
    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    )
  }
}

// DELETE /api/invoices?id=... - Delete invoice
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use admin client to check user role
    const adminClient = getAdminClient();
    const { data: userRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || (userRole.role !== 'admin' && userRole.role !== 'trainer')) {
      return NextResponse.json({ error: 'Forbidden: Only admin or trainer can delete invoices' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing invoice id' }, { status: 400 })
    }

    console.log(`Deleting invoice ${id}`)
    
    // Use admin client to delete invoice directly (bypass RLS)
    const { error } = await adminClient
      .from('invoices')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting invoice:', error)
      return NextResponse.json({ 
        error: `Failed to delete invoice: ${error.message}` 
      }, { status: 500 })
    }
    
    console.log(`Successfully deleted invoice ${id}`)
    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    )
  }
}