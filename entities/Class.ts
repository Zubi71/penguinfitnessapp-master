import { supabase } from '@/utils/supabase/client'
import { SwimClass } from '@/types'

export type ClassData = SwimClass

export class Class {
  static async list(orderBy = 'date'): Promise<ClassData[]> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order(orderBy, { ascending: true })
    
    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<ClassData | null> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async create(classData: Omit<ClassData, 'id' | 'created_at' | 'updated_at'>): Promise<ClassData> {
    const { data, error } = await supabase
      .from('classes')
      .insert([classData])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async update(id: string, classData: Partial<ClassData>): Promise<ClassData> {
    const { data, error } = await supabase
      .from('classes')
      .update(classData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async getByInstructor(instructorId: string): Promise<ClassData[]> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('instructor_id', instructorId)
      .eq('status', 'active')
      .order('date')
    
    if (error) throw error
    return data || []
  }

  static async getByLevel(level: 'beginner' | 'intermediate' | 'advanced'): Promise<ClassData[]> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('level', level)
      .eq('status', 'active')
      .order('date')
    
    if (error) throw error
    return data || []
  }

  static async getAvailableClasses(): Promise<ClassData[]> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('status', 'active')
      .order('date')
    
    if (error) throw error
    // filter classes where current_enrollment < max_capacity
    return (data || []).filter(c => (c.current_enrollment || 0) < c.max_capacity)
  }

  static async updateParticipantCount(id: string, increment: boolean = true): Promise<ClassData> {
    const { data: classData, error: fetchError } = await supabase
      .from('classes')
      .select('current_enrollment')
      .eq('id', id)
      .single()
    
    if (fetchError) throw fetchError
    
    const newCount = increment 
      ? (classData.current_enrollment || 0) + 1
      : Math.max(0, (classData.current_enrollment || 0) - 1)
    
    const { data, error } = await supabase
      .from('classes')
      .update({ current_enrollment: newCount })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async getClassSchedule(date?: string): Promise<ClassData[]> {
    let query = supabase
      .from('classes')
      .select('*')
      .eq('status', 'active')
    
    if (date) {
      query = query.eq('date', date)
    }
    
    const { data, error } = await query.order('start_time')
    
    if (error) throw error
    return data || []
  }

  static hasAvailableSpots(classData: ClassData): boolean {
    return (classData.current_enrollment || 0) < classData.max_capacity
  }

  static getClassDuration(classData: ClassData): string {
    const duration = classData.duration_minutes ?? 0;
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`
    }
    return `${minutes}m`
  }
}