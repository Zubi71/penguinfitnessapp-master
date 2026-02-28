# Send Client Reminder Feature

This feature allows trainers and administrators to send email reminders to their clients directly from the client list interface.

## Components Added

### 1. `SendReminderModal.tsx`
- Modal component for composing and sending reminders
- Pre-defined reminder types (General, Session, Payment, Check-in, Motivational)
- Custom message editing capability
- Client information display

### 2. Updated `ClientList.tsx`
- Added prominent "Send Reminder" button for each client
- Integrated modal functionality
- Toast notifications for success/error feedback
- Authentication-aware API calls

### 3. API Route: `/api/send-client-reminder`
- Secure endpoint with authentication and authorization
- Role-based access control (trainers and admins only)
- Trainer-client relationship validation
- Professional email template using existing system

## Features

### Reminder Types
1. **General Reminder** - Generic fitness motivation message
2. **Session Reminder** - Upcoming training session notification
3. **Payment Reminder** - Outstanding payment notification
4. **Check-in Message** - Wellness check and progress inquiry
5. **Motivational Message** - Encouragement and goal-focused content

### Security
- Authentication required (logged-in users only)
- Role-based authorization (trainers and admins only)
- Trainers can only send reminders to their assigned clients
- Admins can send reminders to any client

### User Experience
- One-click access via prominent green "Send Reminder" button
- User-friendly modal with client information display
- Pre-filled message templates that can be customized
- Success/error feedback via toast notifications
- Professional email templates with company branding

## Technical Implementation

### Email Template
- Reuses existing email infrastructure (Resend + React Email)
- Professional styling with company branding
- Responsive design for all email clients
- Call-to-action button linking to client dashboard

### Database Integration
- Validates trainer-client relationships via `clients` table
- Checks user roles via `user_roles` table
- Uses Supabase authentication for security

### Error Handling
- Comprehensive input validation
- Graceful error messages for users
- Detailed error logging for debugging
- Network error resilience

## Usage

1. Navigate to the client list (Dashboard → Clients)
2. Find the client you want to send a reminder to
3. Click the green "Send Reminder" button
4. Select the reminder type from the dropdown
5. Customize the message if needed
6. Click "Send Reminder"
7. Receive confirmation via toast notification

## Dependencies
- Resend (email service)
- Sonner (toast notifications)
- Supabase (authentication and database)
- Radix UI components (modal, select, etc.)
