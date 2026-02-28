import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params
    const { reminderType = 'all' } = await request.json().catch(() => ({ reminderType: 'all' }))
    
    console.log('Reminder API called for class:', classId)
    
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

    // Create admin client for operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check user role (using admin client to bypass RLS)
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || !userRole) {
      return NextResponse.json({ error: 'User role not found' }, { status: 403 })
    }

    // Only allow admin and trainer access
    if (userRole.role !== 'admin' && userRole.role !== 'trainer') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    if (!classId) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      )
    }

    // Get class details
    const { data: classData, error: classError } = await supabaseAdmin
      .from('classes')
      .select(`
        *,
        trainer:trainers(id, first_name, last_name, email, phone)
      `)
      .eq('id', classId)
      .single()

    if (classError || !classData) {
      console.error('Class error:', classError)
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Get enrolled students
    const { data: enrollments, error: enrollmentError } = await supabaseAdmin
      .from('class_enrollments')
      .select(`
        *,
        client:client_signups(id, first_name, last_name, email, phone)
      `)
      .eq('class_id', classId)
      .eq('status', 'active')

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError)
      return NextResponse.json(
        { error: 'Failed to fetch enrolled students' },
        { status: 500 }
      )
    }

    const enrolledStudents = enrollments || []
    
    // Initialize results structure that matches what ClassForm expects
    const results = {
      classInfo: {
        name: classData.title || classData.name || 'Class',
        date: classData.date || 'TBD',
        time: classData.time || `${classData.start_time || ''} - ${classData.end_time || ''}`.trim() || 'TBD',
        location: classData.location || 'TBD'
      },
      sent: {
        email: 0,
        whatsapp: 0,
        failed: 0
      },
      details: [] as Array<{
        student: string;
        email: string;
        phone: string;
        emailSent: boolean;
        whatsappSent: boolean;
        success: boolean;
      }>
    }

    if (enrolledStudents.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No enrolled students found',
        results
      })
    }

    // Process each enrolled student
    for (const enrollment of enrolledStudents) {
      const client = enrollment.client
      if (!client) continue

      const studentResult = {
        student: `${client.first_name || ''} ${client.last_name || ''}`.trim(),
        email: client.email || '',
        phone: client.phone || '',
        emailSent: false,
        whatsappSent: false,
        success: false
      }

      // Send email reminder if email exists
      if (client.email && (reminderType === 'all' || reminderType === 'email')) {
        try {
          const { data, error } = await resend.emails.send({
            from: 'Penguin Fitness <fitness@penguinfitness.sg>',
            to: [client.email],
            subject: `Class Reminder: ${results.classInfo.name}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0; text-align: center;">🏊‍♀️ Class Reminder</h1>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 16px; color: #333;">Hi ${client.first_name || 'there'},</p>
                  
                  <p style="font-size: 16px; color: #333;">
                    This is a friendly reminder about your upcoming class!
                  </p>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                    <h3 style="margin-top: 0; color: #333;">📅 Class Details</h3>
                    <p style="margin: 8px 0;"><strong>Class:</strong> ${results.classInfo.name}</p>
                    <p style="margin: 8px 0;"><strong>Date:</strong> ${results.classInfo.date}</p>
                    <p style="margin: 8px 0;"><strong>Time:</strong> ${results.classInfo.time}</p>
                    <p style="margin: 8px 0;"><strong>Location:</strong> ${results.classInfo.location}</p>
                  </div>
                  
                  <p style="font-size: 14px; color: #666; margin-top: 20px;">
                    If you need to reschedule or have any questions, please contact us as soon as possible.
                  </p>
                  
                  <p style="font-size: 16px; color: #333;">
                    See you in class! 💪
                  </p>
                  
                  <p style="font-size: 14px; color: #666;">
                    Best regards,<br>
                    <strong>Penguin Fitness Team</strong>
                  </p>
                </div>
              </div>
            `,
            text: `Class Reminder

Hi ${client.first_name || 'there'},

This is a friendly reminder about your upcoming class!

Class Details:
- Class: ${results.classInfo.name}
- Date: ${results.classInfo.date}
- Time: ${results.classInfo.time}
- Location: ${results.classInfo.location}

If you need to reschedule or have any questions, please contact us as soon as possible.

See you in class!

Best regards,
Penguin Fitness Team`
          })

          if (!error && data) {
            studentResult.emailSent = true
            studentResult.success = true
            results.sent.email++
            console.log('Email sent successfully to:', client.email, 'ID:', data.id)
          } else {
            console.error('Resend error for', client.email, ':', error)
            results.sent.failed++
          }
        } catch (emailError) {
          console.error('Email sending error for', client.email, ':', emailError)
          results.sent.failed++
        }
      }

      // Note: WhatsApp integration would go here if needed
      // For now, we're just tracking email reminders

      results.details.push(studentResult)
    }

    return NextResponse.json({
      success: true,
      message: `Reminders sent successfully. Emails: ${results.sent.email}, Failed: ${results.sent.failed}`,
      results
    })
    
  } catch (error) {
    console.error('Reminder route error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
