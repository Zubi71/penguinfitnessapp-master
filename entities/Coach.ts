import { createClient } from '@/utils/supabase/client'

export interface CoachData {
  id?: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  hire_date?: string;
  created_at?: string;
  updated_at?: string;
}

export class Coach {
  static async list(orderBy = 'created_at'): Promise<CoachData[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('trainers_legacy')
      .select('*')
      .order(orderBy);
    
    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<CoachData | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('trainers_legacy')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getByUserId(userId: string): Promise<CoachData | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('trainers_legacy')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) return null;
    return data;
  }

  static async getByEmail(email: string): Promise<CoachData | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('trainers_legacy')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) return null;
    return data;
  }

  static async create(coachData: Omit<CoachData, 'id' | 'created_at' | 'updated_at'>): Promise<CoachData> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('trainers_legacy')
      .insert([coachData]);
    
    if (error) throw error;
    
    // Return the created coach data
    const { data, error: fetchError } = await supabase
      .from('trainers_legacy')
      .select('*')
      .eq('email', coachData.email)
      .single();
    
    if (fetchError) throw fetchError;
    return data;
  }

  static async update(id: string, updates: Partial<CoachData>): Promise<CoachData> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('trainers_legacy')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('trainers_legacy')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async search(searchTerm: string): Promise<CoachData[]> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('trainers_legacy')
      .select('*')
      .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    
    if (error) throw error;
    return data || [];
  }
}

// Export aliases for backward compatibility
export const Instructor = Coach;
export const Trainer = Coach;
export type InstructorData = CoachData;
export type TrainerData = CoachData;
export default Coach;
