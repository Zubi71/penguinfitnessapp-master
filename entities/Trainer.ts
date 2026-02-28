import { supabase } from '@/utils/supabase/client'

export interface TrainerData {
  id?: string
  user_id?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  hire_date?: string
  created_at?: string
  updated_at?: string
  // Computed fields
  classes_count?: number
}

export class Trainer {
  static async list(orderBy = 'created_at'): Promise<TrainerData[]> {
    const { data, error } = await supabase
      .from('trainers')
      .select(`
        *,
        classes_count:classes(count)
      `)
      .order(orderBy, { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<TrainerData | null> {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async create(trainerData: Omit<TrainerData, 'id' | 'created_at' | 'updated_at'>): Promise<TrainerData> {
    const { data, error } = await supabase
      .from('trainers')
      .insert([trainerData])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async update(id: string, trainerData: Partial<TrainerData>): Promise<TrainerData> {
    const { data, error } = await supabase
      .from('trainers')
      .update(trainerData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('trainers')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async getByUserId(userId: string): Promise<TrainerData | null> {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) return null
    return data
  }

  static async search(searchTerm: string): Promise<TrainerData[]> {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    
    if (error) throw error
    return data || []
  }
}

// Export aliases for backward compatibility
export const Instructor = Trainer;
export type InstructorData = TrainerData;
export default Trainer;
