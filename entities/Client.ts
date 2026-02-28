import { supabase } from '@/utils/supabase/client'
import { ClientSignup } from '@/types'

export type ClientData = ClientSignup

export class Client {
  static async list(orderBy = 'submitted_at'): Promise<ClientData[]> {
    const { data, error } = await supabase
      .from('client_signups')
      .select('*')
      .order(orderBy, { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<ClientData | null> {
    const { data, error } = await supabase
      .from('client_signups')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async create(clientData: Omit<ClientData, 'id' | 'submitted_at'>): Promise<ClientData> {
    const { data, error } = await supabase
      .from('client_signups')
      .insert([clientData])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async update(id: string, clientData: Partial<ClientData>): Promise<ClientData> {
    const { data, error } = await supabase
      .from('client_signups')
      .update(clientData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('client_signups')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async search(query: string): Promise<ClientData[]> {
    const { data, error } = await supabase
      .from('client_signups')
      .select('*')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('first_name')
    
    if (error) throw error
    return data || []
  }

  static async getByUserId(userId: string): Promise<ClientData | null> {
    const { data, error } = await supabase
      .from('client_signups')
      .select('*')
      .eq('id', userId) // In your schema, the id in client_signups is the user_id
      .single()
    
    if (error) throw error
    return data
  }

  static async getByStatus(status: 'pending' | 'approved' | 'enrolled' | 'declined'): Promise<ClientData[]> {
    const { data, error } = await supabase
      .from('client_signups')
      .select('*')
      .eq('status', status)
      .order('submitted_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async approve(id: string): Promise<ClientData> {
    const { data, error } = await supabase
      .from('client_signups')
      .update({ status: 'approved' })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async enroll(id: string): Promise<ClientData> {
    const { data, error } = await supabase
      .from('client_signups')
      .update({ status: 'enrolled' })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Get client full name
  static getFullName(client: ClientData): string {
    return `${client.first_name} ${client.last_name}`
  }

  // Get age from birthday
  static getAge(client: ClientData): number | null {
    if (!client.birthday_year) return null
    return new Date().getFullYear() - client.birthday_year
  }

  // Check if client is minor (needs parent info)
  static isMinor(client: ClientData): boolean {
    const age = this.getAge(client)
    return age !== null && age < 18
  }
}