import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Create transporter for email sending
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    })
}

const generateFitnessClassReminderEmail = (data: any) => {
    return {
        subject: `Reminder: Fitness Class Tomorrow - ${data.class_name}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #43cea2 0%, #185a9d 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; text-align: center;">💪 Fitness Class Reminder</h1>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p style="font-size: 16px; color: #333;">Hi ${data.participant_name},</p>
                    
                    <p style="font-size: 16px; color: #333;">
                        This is a friendly reminder about your upcoming fitness class!
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #43cea2;">
                        <h3 style="margin-top: 0; color: #333;">📅 Class Details</h3>
                        <p style="margin: 8px 0;"><strong>Class:</strong> ${data.class_name}</p>
                        <p style="margin: 8px 0;"><strong>Date:</strong> ${data.class_date}</p>
                        <p style="margin: 8px 0;"><strong>Time:</strong> ${data.class_time}</p>
                        <p style="margin: 8px 0;"><strong>Location:</strong> ${data.location}</p>
                        <p style="margin: 8px 0;"><strong>Instructor:</strong> ${data.instructor_name}</p>
                    </div>
                    
                    <div style="background: #e0f7fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #00838f;">🏋️‍♂️ What to Bring:</h4>
                        <ul style="color: #333; margin: 10px 0;">
                            <li>Comfortable workout clothes</li>
                            <li>Training shoes</li>
                            <li>Water bottle</li>
                            <li>Towel</li>
                            <li>Great energy!</li>
                        </ul>
                    </div>
                    
                    <p style="font-size: 14px; color: #666; margin-top: 20px;">
                        If you need to reschedule or have any questions, please contact us as soon as possible.
                    </p>
                    
                    <p style="font-size: 16px; color: #333;">
                        Let's get stronger together! 💪
                    </p>
                    
                    <p style="font-size: 14px; color: #666;">
                        Best regards,<br>
                        <strong>Penguin Fitness Team</strong>
                    </p>
                </div>
            </div>
        `,
        text: `
Fitness Class Reminder

Hi ${data.participant_name},

This is a friendly reminder about your upcoming fitness class!

Class Details:
- Class: ${data.class_name}
- Date: ${data.class_date}
- Time: ${data.class_time}
- Location: ${data.location}
- Instructor: ${data.instructor_name}

What to bring:
- Comfortable workout clothes
- Training shoes
- Water bottle
- Towel
- Great energy!

If you need to reschedule or have any questions, please contact us as soon as possible.

Let's get stronger together!

Best regards,
Penguin Fitness Team
        `
    }
}

export async function POST(request: NextRequest) {
    try {
        const { type, to, data } = await request.json()

        if (!to || !type) {
            return NextResponse.json(
                { error: 'Recipient email and type are required' },
                { status: 400 }
            )
        }

        const transporter = createTransporter()

        let emailContent
        switch (type) {
            case 'fitness_class_reminder':
                emailContent = generateFitnessClassReminderEmail(data)
                break
            default:
                return NextResponse.json(
                    { error: 'Unsupported email type' },
                    { status: 400 }
                )
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@penguinfitness.com',
            to,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
        }

        await transporter.sendMail(mailOptions)

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully'
        })

    } catch (error) {
        console.error('Error sending email:', error)
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        )
    }
}