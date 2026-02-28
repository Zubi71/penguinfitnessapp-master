import { supabase } from '@/utils/supabase/client'

export interface AttendanceData {
  id?: string
  client_id: string
  class_id: string
  enrollment_id: string
  date: string
  status?: 'present' | 'absent' | 'late' | 'excused'
  check_in_time?: string
  check_out_time?: string
  notes?: string
  marked_by?: string
  created_at?: string
  updated_at?: string
  // Joined fields
  client?: {
    first_name: string
    last_name: string
    email: string
  }
  class?: {
    name: string
    date: string
    start_time: string
    end_time: string
  }
}

export class Attendance {
  static async list(orderBy = 'date'): Promise<AttendanceData[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        client:client_signups(first_name, last_name, email),
        class:classes(name, date, start_time, end_time)
      `)
      .order(orderBy, { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async getById(id: string): Promise<AttendanceData | null> {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        client:client_signups(first_name, last_name, email),
        class:classes(name, date, start_time, end_time)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  static async create(attendanceData: Omit<AttendanceData, 'id' | 'created_at' | 'updated_at'>): Promise<AttendanceData> {
    const { data, error } = await supabase
      .from('attendance')
      .insert([attendanceData])
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async update(id: string, attendanceData: Partial<AttendanceData>): Promise<AttendanceData> {
    const { data, error } = await supabase
      .from('attendance')
      .update(attendanceData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async getByClassId(classId: string): Promise<AttendanceData[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        client:client_signups(first_name, last_name, email)
      `)
      .eq('class_id', classId)
      .order('client.first_name')
    
    if (error) throw error
    return data || []
  }

  static async getByClientId(clientId: string): Promise<AttendanceData[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        class:classes(name, date, start_time, end_time)
      `)
      .eq('client_id', clientId)
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  static async markAttendance(classId: string, clientId: string, status: 'present' | 'absent' | 'late' | 'excused', markedBy: string): Promise<AttendanceData> {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        class_id: classId,
        client_id: clientId,
        date: today,
        status,
        marked_by: markedBy,
        check_in_time: status === 'present' ? new Date().toTimeString().split(' ')[0] : null
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  static async getAttendanceStats(clientId?: string, classId?: string, startDate?: string, endDate?: string): Promise<{
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendance_rate: number;
  }> {
    let query = supabase.from('attendance').select('status')
    
    if (clientId) query = query.eq('client_id', clientId)
    if (classId) query = query.eq('class_id', classId)
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)
    
    const { data, error } = await query
    
    if (error) throw error
    
    const stats = {
      total: data?.length || 0,
      present: data?.filter(a => a.status === 'present').length || 0,
      absent: data?.filter(a => a.status === 'absent').length || 0,
      late: data?.filter(a => a.status === 'late').length || 0,
      excused: data?.filter(a => a.status === 'excused').length || 0,
      attendance_rate: 0
    }
    stats.attendance_rate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0
    
    return stats
  }
}