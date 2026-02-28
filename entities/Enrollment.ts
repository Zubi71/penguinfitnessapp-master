import { supabase } from '@/utils/supabase/client'
import { ClassEnrollment } from '@/types'

export type EnrollmentData = ClassEnrollment

export class Enrollment {
  static async list(orderBy = 'created_at'): Promise<EnrollmentData[]> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .select('*')
      .order(orderBy, { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<EnrollmentData | null> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async create(enrollmentData: Omit<EnrollmentData, 'id' | 'created_at' | 'updated_at'>): Promise<EnrollmentData> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .insert([enrollmentData])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async update(id: string, enrollmentData: Partial<EnrollmentData>): Promise<EnrollmentData> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .update(enrollmentData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('class_enrollments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async getByClient(clientId: string): Promise<EnrollmentData[]> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .select('*')
      .eq('client_id', clientId)
      .order('enrollment_date', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getByClass(classId: string): Promise<EnrollmentData[]> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .select('*')
      .eq('class_id', classId)
      .eq('status', 'active')
      .order('enrollment_date')
    
    if (error) throw error
    return data || []
  }

  static async getActiveEnrollments(): Promise<EnrollmentData[]> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .select('*')
      .eq('status', 'active')
      .order('enrollment_date', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getByStatus(status: 'active' | 'completed' | 'cancelled' | 'suspended'): Promise<EnrollmentData[]> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .select('*')
      .eq('status', status)
      .order('enrollment_date', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getByPaymentStatus(paymentStatus: 'pending' | 'paid' | 'overdue'): Promise<EnrollmentData[]> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .select('*')
      .eq('payment_status', paymentStatus)
      .order('enrollment_date', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async enrollClient(clientId: string, classId: string, notes?: string): Promise<EnrollmentData> {
    const enrollmentData = {
      client_id: clientId,
      class_id: classId,
      enrollment_date: new Date().toISOString(),
      status: 'active' as const,
      payment_status: 'pending' as const,
      notes
    }

    const { data, error } = await supabase
      .from('class_enrollments')
      .insert([enrollmentData])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async markPaid(id: string): Promise<EnrollmentData> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .update({ payment_status: 'paid' })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async markOverdue(id: string): Promise<EnrollmentData> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .update({ payment_status: 'overdue' })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async cancelEnrollment(id: string, reason?: string): Promise<EnrollmentData> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .update({ 
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Cancelled'
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async suspendEnrollment(id: string, reason?: string): Promise<EnrollmentData> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .update({ 
        status: 'suspended',
        notes: reason ? `Suspended: ${reason}` : 'Suspended'
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async reactivateEnrollment(id: string): Promise<EnrollmentData> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .update({ status: 'active' })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
} 
