import { ExpiryAlert } from '@/components/email-templates/ExpiryAlert';
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check user role (only trainers and admins can send reminders)
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || !['trainer', 'admin'].includes(userRole.role)) {
      return NextResponse.json(
        { error: 'Only trainers and administrators can send client reminders' }, 
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      clientEmail,
      clientFirstName,
      clientLastName,
      reminderType = 'general_reminder',
      message,
      companyName = 'Penguin Fitness',
      actionUrl
    } = body;

    // Validate required fields
    if (!clientEmail || !clientFirstName || !clientLastName) {
      return NextResponse.json(
        { error: 'Missing required fields: clientEmail, clientFirstName, clientLastName' },
        { status: 400 }
      );
    }

    // If the user is a trainer, verify they can send reminders to this client
    if (userRole.role === 'trainer') {
      // Get trainer ID
      const { data: trainer } = await supabase
        .from('trainers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!trainer) {
        return NextResponse.json(
          { error: 'Trainer profile not found' },
          { status: 404 }
        );
      }

      // Check if the client is assigned to this trainer
      const { data: clientRelation } = await supabase
        .from('clients')
        .select('id')
        .eq('email', clientEmail.toLowerCase())
        .eq('trainer_id', trainer.id)
        .single();

      if (!clientRelation) {
        return NextResponse.json(
          { error: 'You can only send reminders to your own clients' },
          { status: 403 }
        );
      }
    }

    // Get subject and email content based on reminder type
    const getSubject = () => {
      switch (reminderType) {
        case 'session_reminder':
          return 'Upcoming Training Session Reminder';
        case 'payment_reminder':
          return 'Payment Reminder';
        case 'check_in':
          return 'How are you doing? Check-in from your trainer';
        case 'motivational':
          return 'Keep up the great work! 💪';
        case 'general_reminder':
        default:
          return 'Reminder from your trainer';
      }
    };

    const getDefaultMessage = () => {
      switch (reminderType) {
        case 'session_reminder':
          return `Don't forget about your upcoming training session. We're looking forward to seeing you!`;
        case 'payment_reminder':
          return `This is a friendly reminder about your outstanding payment. Please complete your payment at your earliest convenience.`;
        case 'check_in':
          return `Hope you're doing well! Just checking in to see how you're feeling and if you have any questions about your training program.`;
        case 'motivational':
          return `You're doing an amazing job with your fitness journey! Keep up the excellent work and remember that consistency is key to achieving your goals.`;
        case 'general_reminder':
        default:
          return `This is a friendly reminder from your trainer. Stay consistent with your workouts and don't hesitate to reach out if you have any questions!`;
      }
    };

    // Create a custom alert using the existing email template
    const { data, error } = await resend.emails.send({
      from: `${companyName} <noreply@penguinfitness.com>`,
      to: [clientEmail],
      subject: getSubject(),
      react: ExpiryAlert({
        firstName: clientFirstName,
        lastName: clientLastName,
        alertType: 'top_up_reminder', // Using this as a base template
        daysRemaining: undefined,
        expiryDate: undefined,
        amount: undefined,
        currency: 'USD',
        packageName: undefined,
        membershipType: undefined,
        actionUrl: actionUrl || `${process.env.NEXT_PUBLIC_APP_URL}/client`,
        companyName,
        logoUrl: undefined
      }),
      // Override with custom HTML for reminder
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${getSubject()}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background-color: #1f2937; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">${companyName}</h1>
            </div>

            <!-- Alert Banner -->
            <div style="background-color: #059669; color: #ffffff; padding: 16px 24px; text-align: center;">
              <h2 style="margin: 0; font-size: 20px; font-weight: bold;">
                💪 Message from your trainer
              </h2>
            </div>

            <!-- Main Content -->
            <div style="padding: 32px 24px;">
              <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
                Hi ${clientFirstName} ${clientLastName},
              </p>

              <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">
                ${message || getDefaultMessage()}
              </p>

              ${actionUrl ? `
                <!-- Action Button -->
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${actionUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px; text-align: center; min-width: 200px;">
                    View Dashboard
                  </a>
                </div>
              ` : ''}

              <!-- Additional Info -->
              <div style="background-color: #fef3c7; border: 1px solid: #f59e0b; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">
                  <strong>Questions?</strong> Feel free to reach out to your trainer or contact our support team for any assistance.
                </p>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; text-align: center;">
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                  Thank you for choosing ${companyName}.<br />
                  This is an automated message. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Email sending error:', error);
      return NextResponse.json(
        { error: 'Failed to send reminder email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder email sent successfully',
      messageId: data?.id
    });

  } catch (error) {
    console.error('Error sending client reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
