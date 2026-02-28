# Stripe Payment & Points System Setup Guide

This guide will help you set up the complete Stripe payment system with points and rewards for community events.

## 🚀 Quick Setup Steps

### 1. Database Setup

Run these SQL scripts in your Supabase SQL Editor in this order:

1. **Points and Rewards Schema** (creates all tables and functions):
   ```sql
   -- Copy and paste the contents of: supabase/points_rewards_schema.sql
   ```

2. **Add Points to Events** (updates existing events):
   ```sql
   -- Copy and paste the contents of: supabase/add_points_to_events.sql
   ```

3. **Increment Function** (for participant counting):
   ```sql
   -- Copy and paste the contents of: supabase/increment_event_participants.sql
   ```

### 2. Environment Variables

Add these to your `.env.local` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Optional: Stripe configuration for production
# STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key_here
# STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key_here
# STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret_here
```

### 3. Stripe Account Setup

1. **Create a Stripe Account** (if you don't have one):
   - Go to [stripe.com](https://stripe.com)
   - Sign up for a free account
   - Complete your business profile

2. **Get Your API Keys**:
   - Go to Stripe Dashboard → Developers → API Keys
   - Copy your **Publishable Key** and **Secret Key**
   - Add them to your `.env.local` file

3. **Set Up Webhooks**:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - Set URL to: `https://your-domain.com/api/stripe/webhook`
   - Select these events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `invoice.payment_succeeded`
   - Copy the webhook signing secret and add to `.env.local`

### 4. Install Stripe Package

```bash
npm install stripe
```

## 🎯 How It Works

### Points System

- **Earning Points**: Clients earn points when they register for events
  - Free events: 50 points
  - Events ≤ $25: 100 points
  - Events $26-$50: 200 points
  - Events > $50: 300 points

- **Rewards Milestones**:
  - 500 points: 10% discount on next event
  - 1,000 points: 15% discount on next event
  - 2,000 points: 20% discount on next event
  - 5,000 points: Free event registration

### Payment Flow

1. **Client clicks "Register"** on a paid event
2. **System creates Stripe Payment Intent** and Invoice
3. **Invoice is sent to client's email** automatically
4. **Client pays via Stripe** (email link or dashboard)
5. **Webhook processes successful payment**:
   - Registers client for event
   - Awards points
   - Checks for milestone rewards
   - Updates participant count

### Features

✅ **Automatic Email Invoices**: Every payment generates a professional invoice sent to the client's email

✅ **Points Tracking**: Complete history of points earned and spent

✅ **Rewards System**: Automatic milestone rewards with expiration dates

✅ **Payment History**: Track all payments and their status

✅ **Real-time Updates**: Points and rewards update immediately after payment

## 🔧 Testing the System

### 1. Test with Stripe Test Cards

Use these test card numbers in Stripe:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### 2. Test Points System

1. Create a test event with a price
2. Register a test client
3. Check that points are awarded
4. Verify rewards are given at milestones

### 3. Test Email Invoices

1. Register for a paid event
2. Check the client's email for the invoice
3. Verify invoice contains event details

## 📊 Points & Rewards Management

### Viewing Points

Clients can view their points and rewards on the community events page. The system shows:
- Current points balance
- Total points earned
- Active rewards
- Transaction history

### Managing Rewards

Rewards are automatically:
- **Awarded** when milestones are reached
- **Expired** after 1 year
- **Used** when applied to purchases

### Admin Features

Admins can:
- View all client points and transactions
- Manually award points
- Create custom rewards
- Monitor payment history

## 🚨 Important Notes

### Security

- **Never commit API keys** to version control
- **Use test keys** for development
- **Rotate keys** regularly in production
- **Verify webhook signatures** (already implemented)

### Production Deployment

1. **Switch to live Stripe keys** in production
2. **Update webhook URL** to production domain
3. **Test payment flow** thoroughly
4. **Monitor webhook events** in Stripe dashboard

### Database Backups

- **Backup your database** before running schema changes
- **Test in staging** before production
- **Monitor for errors** after deployment

## 🆘 Troubleshooting

### Common Issues

1. **Webhook not receiving events**:
   - Check webhook URL is correct
   - Verify webhook secret in environment
   - Check Stripe dashboard for failed deliveries

2. **Points not awarded**:
   - Check webhook is processing `payment_intent.succeeded`
   - Verify database functions exist
   - Check client_points table has records

3. **Invoice not sent**:
   - Verify Stripe account has email sending enabled
   - Check client email is valid
   - Review Stripe dashboard for invoice status

### Debug Commands

```bash
# Check if Stripe package is installed
npm list stripe

# Test database connection
npm run build

# Check environment variables
echo $STRIPE_SECRET_KEY
```

## 📞 Support

If you encounter issues:

1. **Check Stripe Dashboard** for payment status
2. **Review webhook logs** in Stripe
3. **Check browser console** for errors
4. **Verify database tables** exist and have data

The system is designed to be robust and handle edge cases automatically. Most issues can be resolved by checking the Stripe dashboard and ensuring all environment variables are set correctly.
