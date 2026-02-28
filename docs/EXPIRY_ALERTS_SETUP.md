# Expiry Alert Email System

This system provides comprehensive email alerts for subscription expiry, payment due reminders, top-up notifications, and other time-sensitive alerts for the Penguin Fitness application.

## Features

- **Multiple Alert Types**: Subscription expiry, payment due, top-up reminders, membership expiry, package expiry
- **Dynamic Styling**: Color-coded urgency levels (red for urgent, orange for warning, green for normal)
- **Responsive Design**: Professional email template that works across all email clients
- **Customizable Content**: Easy to modify messages, branding, and call-to-action buttons
- **Testing Tools**: Built-in preview and testing functionality

## Components

### 1. Email Template (`components/email-templates/ExpiryAlert.tsx`)

The main email template component that renders different types of expiry alerts.

**Props:**
- `firstName`, `lastName`: Recipient's name
- `alertType`: Type of alert ('subscription_expiry', 'payment_due', 'top_up_reminder', 'membership_expiry', 'package_expiry')
- `daysRemaining`: Number of days until expiry
- `expiryDate`: Expiry date (ISO string)
- `amount`: Amount due (for payment alerts)
- `currency`: Currency code (default: 'USD')
- `packageName`: Name of the package (for package expiry)
- `membershipType`: Type of membership (for membership expiry)
- `actionUrl`: URL for the call-to-action button
- `companyName`: Company name (default: 'Penguin Fitness')
- `logoUrl`: Optional company logo URL

### 2. API Routes

#### `/api/send-expiry-alert`
Main API endpoint for sending expiry alert emails.

**Request Body:**
```json
{
  "to": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "alertType": "subscription_expiry",
  "daysRemaining": 3,
  "expiryDate": "2024-01-15",
  "actionUrl": "https://example.com/renew",
  "companyName": "Penguin Fitness"
}
```

#### `/api/test-expiry-alert`
Test endpoint for sending sample emails with predefined configurations.

**Request Body:**
```json
{
  "testType": "subscription_expiry",
  "email": "test@example.com"
}
```

### 3. Utility Service (`lib/expiry-alerts.ts`)

The `ExpiryAlertService` class provides helper methods for sending alerts programmatically.

**Key Methods:**
- `sendAlert()`: Send a single alert email
- `checkAndSendSubscriptionAlerts()`: Check for expiring subscriptions and send alerts
- `checkAndSendPaymentAlerts()`: Check for overdue payments and send alerts
- `sendCustomAlert()`: Send a custom alert with specific parameters
- `sendTopUpReminder()`: Send top-up reminder
- `sendMembershipExpiryAlert()`: Send membership expiry alert
- `sendPackageExpiryAlert()`: Send package expiry alert

## Usage Examples

### 1. Send a Subscription Expiry Alert

```typescript
import { ExpiryAlertService } from '@/lib/expiry-alerts';

const result = await ExpiryAlertService.sendMembershipExpiryAlert(
  'user@example.com',
  'John',
  'Doe',
  'Premium',
  3,
  '2024-01-15'
);

if (result.success) {
  console.log('Alert sent successfully:', result.messageId);
} else {
  console.error('Failed to send alert:', result.error);
}
```

### 2. Send a Payment Due Alert

```typescript
import { ExpiryAlertService } from '@/lib/expiry-alerts';

const result = await ExpiryAlertService.sendCustomAlert(
  'user@example.com',
  'Jane',
  'Smith',
  'payment_due',
  {
    amount: 99.99,
    currency: 'USD',
    actionUrl: 'https://example.com/pay'
  }
);
```

### 3. Check and Send Bulk Alerts

```typescript
import { ExpiryAlertService } from '@/lib/expiry-alerts';

// Check for expiring subscriptions
const subscriptionResult = await ExpiryAlertService.checkAndSendSubscriptionAlerts();
console.log(`Sent ${subscriptionResult.sent} subscription alerts, ${subscriptionResult.errors} errors`);

// Check for overdue payments
const paymentResult = await ExpiryAlertService.checkAndSendPaymentAlerts();
console.log(`Sent ${paymentResult.sent} payment alerts, ${paymentResult.errors} errors`);
```

## Customization

### 1. Modify Email Template

Edit `components/email-templates/ExpiryAlert.tsx` to:
- Change colors and styling
- Add company logo
- Modify message content
- Add additional sections

### 2. Add New Alert Types

1. Add the new alert type to the `alertType` union type
2. Update the `getAlertTitle()`, `getAlertMessage()`, and `getActionButtonText()` methods
3. Add validation in the API route
4. Update the preview component

### 3. Customize Database Queries

Modify the database queries in `lib/expiry-alerts.ts` to match your actual schema:

```typescript
// Example: Query for expiring subscriptions
const { data: expiringSubscriptions, error } = await supabase
  .from('subscriptions')
  .select(`
    *,
    client:client_signups(first_name, last_name, email)
  `)
  .eq('status', 'active')
  .lt('expiry_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
```

## Testing

### 1. Preview Email Templates

Visit `/email-preview` to see the interactive preview tool that allows you to:
- Test different alert types
- Customize all parameters
- Send test emails
- See real-time preview

### 2. Send Test Emails

Use the test API endpoint:

```bash
curl -X POST http://localhost:3000/api/test-expiry-alert \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "subscription_expiry",
    "email": "test@example.com"
  }'
```

## Environment Variables

Make sure to set these environment variables:

```env
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Integration with Cron Jobs

To automatically send alerts, set up a cron job or scheduled task:

```typescript
// Example: Daily check for expiring subscriptions
import { ExpiryAlertService } from '@/lib/expiry-alerts';

export async function dailyExpiryCheck() {
  console.log('Starting daily expiry check...');
  
  const subscriptionResult = await ExpiryAlertService.checkAndSendSubscriptionAlerts();
  const paymentResult = await ExpiryAlertService.checkAndSendPaymentAlerts();
  
  console.log(`Daily check complete: ${subscriptionResult.sent + paymentResult.sent} alerts sent`);
}
```

## Best Practices

1. **Rate Limiting**: Implement rate limiting to prevent spam
2. **Error Handling**: Always handle errors gracefully and log them
3. **Testing**: Test emails in different email clients
4. **Unsubscribe**: Include unsubscribe links in emails
5. **Compliance**: Ensure compliance with email regulations (CAN-SPAM, GDPR)
6. **Monitoring**: Monitor email delivery rates and bounce rates

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check Resend API key and configuration
2. **Template not rendering**: Verify React component syntax
3. **Database errors**: Check database connection and query syntax
4. **Rate limiting**: Implement delays between bulk sends

### Debug Mode

Enable debug logging by setting:

```env
DEBUG_EMAILS=true
```

This will log detailed information about email sending attempts.

## Support

For issues or questions about the expiry alert system, please check:
1. The email preview tool at `/email-preview`
2. The API documentation above
3. The console logs for error messages
4. The Resend dashboard for delivery status 