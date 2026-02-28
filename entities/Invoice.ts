import { supabase } from '@/utils/supabase/client'
import Stripe from 'stripe'

// Only initialize Stripe on server side
const getStripe = () => {
  if (typeof window !== 'undefined') {
    // Running on client side - don't initialize Stripe
    return null;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY || '');
}

export interface InvoiceLineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface InvoiceData {
  id?: string
  client_id: string
  class_id?: string
  enrollment_id?: string
  invoice_number?: string
  amount: number
  tax_amount?: number
  total_amount: number
  currency?: string
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  issue_date?: string
  paid_date?: string
  description?: string
  line_items?: InvoiceLineItem[]
  notes?: string
  created_by?: string
  created_at?: string
  updated_at?: string
  stripe_invoice_id?: string
  // Joined fields
  client?: {
    first_name: string
    last_name: string
    email: string
  }
  class?: {
    id: string
    name: string
    date: string
  }
  enrollment?: {
    id: string
    status: string
  }
}

export class Invoice {
  static async list(orderBy = 'created_at'): Promise<InvoiceData[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:client_signups(first_name, last_name, email)
      `)
      .order(orderBy, { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<InvoiceData | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:client_signups(first_name, last_name, email)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async create(invoiceData: Omit<InvoiceData, 'id' | 'created_at' | 'updated_at'>): Promise<InvoiceData> {
    // Generate invoice number if not provided
    if (!invoiceData.invoice_number) {
      const count = await this.getInvoiceCount()
      
      // Generate custom invoice number: PFI(year)/MM/001
      const now = new Date();
      const year = String(now.getFullYear()).slice(-2); // Last 2 digits of year (25 for 2025)
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Month with leading zero
      const sequence = String(count + 1).padStart(3, '0'); // 3-digit sequence number
      
      invoiceData.invoice_number = `PFI${year}/${month}/${sequence}`;
    }

    // Extract client info for Stripe operations (don't include in DB insert)
    const clientInfo = invoiceData.client
    const { client, class: classInfo, enrollment, ...dbInvoiceData } = invoiceData

    // 1. Create Stripe customer if needed
    let stripeCustomerId: string | undefined
    const stripe = getStripe()
    if (stripe && clientInfo?.email) {
      const customers = await stripe.customers.list({ email: clientInfo.email, limit: 1 })
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email: clientInfo.email,
          name: `${clientInfo.first_name} ${clientInfo.last_name}`
        })
        stripeCustomerId = customer.id
      }
    }

    // 2. Create Stripe invoice item
    if (stripe && stripeCustomerId) {
      const stripeInvoiceItem = await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        amount: Math.round(dbInvoiceData.total_amount * 100), // in cents
        currency: dbInvoiceData.currency || 'sgd',
        description: dbInvoiceData.description || 'Swim School Invoice'
      })

      // 3. Create Stripe invoice
      const stripeInvoice = await stripe.invoices.create({
        customer: stripeCustomerId!,
        auto_advance: true,
        collection_method: 'charge_automatically',
        number: dbInvoiceData.invoice_number, // Set custom invoice number in Stripe
        description: dbInvoiceData.description || 'Swim School Invoice',
        metadata: { local_invoice_number: dbInvoiceData.invoice_number || '' }
      })

      // 4. Store in DB (only database fields, no joined data)
      const { data, error } = await supabase
        .from('invoices')
        .insert([{ ...dbInvoiceData, stripe_invoice_id: stripeInvoice.id }])
        .select()
        .single()
      if (error) throw error
      return data
    } else {
      // Store in DB without Stripe integration (only database fields)
      const { data, error } = await supabase
        .from('invoices')
        .insert([dbInvoiceData])
        .select()
        .single()
      if (error) throw error
      return data
    }
  }

  static async update(id: string, invoiceData: Partial<InvoiceData>): Promise<InvoiceData> {
    const { data, error } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async getByClientId(clientId: string): Promise<InvoiceData[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .order('issue_date', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getOverdueInvoices(): Promise<InvoiceData[]> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:client_signups(first_name, last_name, email)
      `)
      .in('status', ['sent', 'overdue'])
      .lt('due_date', today)
      .order('due_date')
    
    if (error) throw error
    return data || []
  }

  static async markAsPaid(id: string, paidDate?: string): Promise<InvoiceData> {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_date: paidDate || new Date().toISOString().split('T')[0]
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async markAsOverdue(): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'overdue' })
      .eq('status', 'sent')
      .lt('due_date', today)
    
    if (error) throw error
  }

  static async getInvoiceCount(): Promise<number> {
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    return count || 0
  }

  static async createFromEnrollments(clientId: string, enrollmentIds: string[]): Promise<InvoiceData> {
    // Get enrollment details
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('class_enrollments')
      .select(`
        *,
        class:classes(name, price)
      `)
      .in('id', enrollmentIds)
      .eq('client_id', clientId)
    
    if (enrollmentError) throw enrollmentError
    
    if (!enrollments || enrollments.length === 0) {
      throw new Error('No enrollments found')
    }
    
    // Calculate totals
    const lineItems: InvoiceLineItem[] = enrollments.map(enrollment => ({
      description: `Class: ${enrollment.class?.name}`,
      quantity: 1,
      unit_price: enrollment.class?.price || 0,
      total: enrollment.class?.price || 0
    }))
    
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
    const taxRate = 0.10 // 10% tax
    const taxAmount = subtotal * taxRate
    const totalAmount = subtotal + taxAmount
    
    // Create invoice
    return await this.create({
      client_id: clientId,
      invoice_number: '', // Will be auto-generated
      amount: subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      description: `Invoice for ${lineItems.length} class(es)`,
      line_items: lineItems,
      status: 'draft'
    })
  }

  // Helper to update invoice status from Stripe webhook
  static async syncFromStripe(stripeInvoiceId: string, status: string, paidDate?: string) {
    // Use admin client to bypass RLS for webhook operations
    const { createClient } = await import('@supabase/supabase-js')
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    let localStatus: InvoiceData['status'] = 'draft'
    if (status === 'paid') localStatus = 'paid'
    else if (status === 'open') localStatus = 'sent'
    else if (status === 'uncollectible') localStatus = 'overdue'
    else if (status === 'void') localStatus = 'cancelled'
    
    console.log(`Syncing invoice ${stripeInvoiceId} status from Stripe: ${status} -> ${localStatus}`)
    
    const { error } = await adminClient
      .from('invoices')
      .update({ status: localStatus, paid_date: paidDate })
      .eq('stripe_invoice_id', stripeInvoiceId)
      
    if (error) {
      console.error('Error syncing invoice status:', error)
    } else {
      console.log(`Successfully synced invoice ${stripeInvoiceId} status to ${localStatus}`)
    }
  }
}