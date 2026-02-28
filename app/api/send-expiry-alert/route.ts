import { ExpiryAlert } from '@/components/email-templates/ExpiryAlert';
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      to,
      firstName,
      lastName,
      alertType,
      daysRemaining,
      expiryDate,
      amount,
      currency = 'USD',
      packageName,
      membershipType,
      actionUrl,
      companyName = 'Penguin Fitness',
      logoUrl
    } = body;

    // Validate required fields
    if (!to || !firstName || !lastName || !alertType) {
      return NextResponse.json(
        { error: 'Missing required fields: to, firstName, lastName, alertType' },
        { status: 400 }
      );
    }

    // Validate alert type
    const validAlertTypes = [
      'subscription_expiry',
      'payment_due',
      'top_up_reminder',
      'membership_expiry',
      'package_expiry'
    ];

    if (!validAlertTypes.includes(alertType)) {
      return NextResponse.json(
        { error: 'Invalid alert type' },
        { status: 400 }
      );
    }

    // Get subject based on alert type
    const getSubject = () => {
      switch (alertType) {
        case 'subscription_expiry':
          return 'Your subscription is expiring soon';
        case 'payment_due':
          return 'Payment due reminder';
        case 'top_up_reminder':
          return 'Account top-up reminder';
        case 'membership_expiry':
          return 'Your membership is expiring soon';
        case 'package_expiry':
          return 'Your package is expiring soon';
        default:
          return 'Important account alert';
      }
    };

    const { data, error } = await resend.emails.send({
      from: `${companyName} <noreply@${companyName.toLowerCase().replace(/\s+/g, '')}.com>`,
      to: [to],
      subject: getSubject(),
      react: ExpiryAlert({
        firstName,
        lastName,
        alertType,
        daysRemaining,
        expiryDate,
        amount,
        currency,
        packageName,
        membershipType,
        actionUrl,
        companyName,
        logoUrl
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      messageId: data?.id,
      message: 'Expiry alert email sent successfully'
    });

  } catch (error) {
    console.error('Send expiry alert error:', error);
    return NextResponse.json(
      { error: 'Failed to send expiry alert email' },
      { status: 500 }
    );
  }
} 