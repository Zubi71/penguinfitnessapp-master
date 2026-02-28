import { supabase } from '@/utils/supabase/client'

export interface PaymentData {
  id?: string
  client_id: string
  enrollment_id?: string
  amount: number
  currency?: string
  payment_method?: 'cash' | 'card' | 'bank_transfer' | 'online' | 'check'
  payment_type?: 'class_fee' | 'membership' | 'late_fee' | 'refund' | 'other'
  status?: 'pending' | 'completed' | 'failed' | 'refunded'
  transaction_id?: string
  reference_number?: string
  due_date?: string
  paid_date?: string
  description?: string
  notes?: string
  processed_by?: string
  created_at?: string
  updated_at?: string
  // Joined fields
  client?: {
    first_name: string
    last_name: string
    email: string
  }
}

export class Payment {
  static async list(orderBy = 'paid_date'): Promise<PaymentData[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        client:client_signups(first_name, last_name, email)
      `)
      .order(orderBy, { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<PaymentData | null> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        client:client_signups(first_name, last_name, email)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async create(paymentData: Omit<PaymentData, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentData> {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async update(id: string, paymentData: Partial<PaymentData>): Promise<PaymentData> {
    const { data, error } = await supabase
      .from('payments')
      .update(paymentData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async getByClientId(clientId: string): Promise<PaymentData[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('client_id', clientId)
      .order('paid_date', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getPendingPayments(): Promise<PaymentData[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        client:client_signups(first_name, last_name, email)
      `)
      .eq('status', 'pending')
      .order('due_date')
    
    if (error) throw error
    return data || []
  }

  static async getOverduePayments(): Promise<PaymentData[]> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        client:client_signups(first_name, last_name, email)
      `)
      .eq('status', 'pending')
      .lt('due_date', today)
      .order('due_date')
    
    if (error) throw error
    return data || []
  }

  static async getRevenueStats(startDate?: string, endDate?: string) {
    let query = supabase
      .from('payments')
      .select('amount, paid_date, payment_type')
      .eq('status', 'completed')
    
    if (startDate) query = query.gte('paid_date', startDate)
    if (endDate) query = query.lte('paid_date', endDate)
    
    const { data, error } = await query
    
    if (error) throw error
    
    const totalRevenue = data?.reduce((sum, payment) => sum + payment.amount, 0) || 0
    const byType = data?.reduce((acc, payment) => {
      acc[payment.payment_type] = (acc[payment.payment_type] || 0) + payment.amount
      return acc
    }, {} as Record<string, number>) || {}
    
    return {
      total_revenue: totalRevenue,
      by_type: byType,
      count: data?.length || 0
    }
  }

  static async getMonthlyRevenue(year: number): Promise<{ month: number; revenue: number }[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('amount, paid_date')
      .eq('status', 'completed')
      .gte('paid_date', `${year}-01-01`)
      .lte('paid_date', `${year}-12-31`)
    
    if (error) throw error
    
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, revenue: 0 }))
    
    data?.forEach(payment => {
      if (payment.paid_date) {
        const month = new Date(payment.paid_date).getMonth() + 1
        monthlyData[month - 1].revenue += payment.amount
      }
    })
    
    return monthlyData
  }
} 