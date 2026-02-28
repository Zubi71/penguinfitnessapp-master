# Referral System Implementation Guide

## Overview

The referral system allows clients to create referral codes, share them with friends, and earn loyalty points when their referrals make purchases. The system includes comprehensive tracking, analytics, and admin management features.

## Features Implemented

### 1. Database Schema
- **referral_codes**: Stores referral codes created by users
- **referral_tracking**: Tracks referral relationships and their status
- **referral_analytics**: Aggregated analytics for referral performance

### 2. API Endpoints
- `GET /api/referrals/codes` - Get user's referral codes
- `POST /api/referrals/codes` - Create new referral code
- `PUT /api/referrals/codes` - Update referral code
- `DELETE /api/referrals/codes` - Delete referral code
- `GET /api/referrals/tracking` - Get referral tracking data
- `POST /api/referrals/tracking` - Track a referral
- `PUT /api/referrals/tracking` - Complete a referral
- `GET /api/referrals/analytics` - Get referral analytics
- `GET /api/referrals/validate` - Validate a referral code
- `POST /api/referrals/complete` - Complete referral on payment
- `GET /api/admin/referrals` - Admin dashboard data
- `POST /api/admin/referrals` - Export referral data

### 3. Client Dashboard
- Referral code creation and management
- Referral activity tracking
- Points earned display
- Referral link sharing
- Analytics overview

### 4. Admin Dashboard
- Complete referral analytics
- Top performer tracking
- Referral activity monitoring
- Data export functionality
- Performance metrics

### 5. Integration Points
- **Payment Processing**: Automatic referral completion on successful payments
- **Registration**: Referral code handling during user registration
- **Loyalty Points**: Seamless integration with existing loyalty system

## Database Setup

Run the SQL script in `supabase/referral_system.sql` to create all necessary tables, functions, and policies:

```sql
-- This creates:
-- 1. referral_codes table
-- 2. referral_tracking table  
-- 3. referral_analytics table
-- 4. Database functions for code generation, tracking, and completion
-- 5. RLS policies for security
-- 6. Triggers for automatic updates
```

## How It Works

### 1. Referral Code Creation
- Users create referral codes through the client dashboard
- Codes are unique 8-character alphanumeric strings
- Users can set usage limits and expiration dates
- Default points per referral: 100

### 2. Referral Tracking
- When a user registers with a referral code, a tracking record is created
- Status starts as 'pending'
- When the referred user makes a purchase, the referral is marked as 'completed'
- Points are automatically awarded to the referrer

### 3. Payment Integration
- Stripe webhook handlers automatically process referrals on payment completion
- Payment success endpoints also handle referral completion
- Integration works with both Stripe payments and manual payments

### 4. Analytics
- Real-time analytics for both clients and admins
- Conversion rate tracking
- Revenue attribution
- Top performer identification

## Usage Examples

### Creating a Referral Code
```javascript
const response = await fetch('/api/referrals/codes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    maxUses: 10,
    pointsPerReferral: 150,
    expiresAt: '2024-12-31T23:59:59Z'
  })
});
```

### Tracking a Referral
```javascript
const response = await fetch('/api/referrals/tracking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    referralCode: 'ABC12345',
    referredClientId: 'client-uuid'
  })
});
```

### Validating a Referral Code
```javascript
const response = await fetch(`/api/referrals/validate?code=${referralCode}`);
const { valid, referralCode: codeData } = await response.json();
```

## Security Features

### Row Level Security (RLS)
- Users can only view their own referral codes and analytics
- Admins can view all referral data
- System functions have appropriate permissions

### Input Validation
- Referral codes are validated before tracking
- Usage limits and expiration dates are enforced
- Duplicate referrals are prevented

### Error Handling
- Comprehensive error messages for invalid codes
- Graceful handling of expired or inactive codes
- Protection against self-referrals

## Configuration Options

### Default Settings
- Points per referral: 100
- Code length: 8 characters
- Maximum uses: Unlimited (unless specified)
- Expiration: None (unless specified)

### Customizable Settings
- Points per referral (1-10,000)
- Maximum uses (1-1,000)
- Expiration date
- Code activation/deactivation

## Monitoring and Analytics

### Client Metrics
- Total referrals made
- Successful referrals
- Points earned
- Conversion rate

### Admin Metrics
- Overall referral performance
- Top performing referrers
- Revenue generated through referrals
- System-wide conversion rates

### Data Export
- CSV export functionality for referral data
- Detailed tracking information
- Performance metrics

## Integration with Existing Systems

### Loyalty Points System
- Automatic point awarding on referral completion
- Integration with existing loyalty transactions
- Points are added to user's loyalty balance

### Payment System
- Automatic referral processing on payment completion
- Works with Stripe webhooks
- Supports manual payment processing

### User Registration
- Referral code validation during registration
- Automatic tracking creation
- Client association

## Troubleshooting

### Common Issues
1. **Referral code not found**: Check if code exists and is active
2. **Self-referral error**: Users cannot refer themselves
3. **Expired code**: Check expiration date
4. **Usage limit reached**: Check maximum uses setting

### Debug Information
- All referral activities are logged
- Error messages provide specific failure reasons
- Admin dashboard shows detailed tracking information

## Future Enhancements

### Potential Improvements
1. **Referral tiers**: Different point values based on referral performance
2. **Bonus campaigns**: Time-limited bonus point promotions
3. **Social sharing**: Direct social media integration
4. **Email notifications**: Automatic notifications for referral activities
5. **Advanced analytics**: More detailed reporting and insights

### Scalability Considerations
- Database indexes for performance
- Efficient querying for large datasets
- Caching for frequently accessed data
- Background processing for analytics updates

## Testing

### Test Scenarios
1. Create referral code
2. Share referral code
3. Register with referral code
4. Make purchase
5. Verify points awarded
6. Check analytics updates

### Edge Cases
- Expired codes
- Usage limits
- Self-referrals
- Invalid codes
- Payment failures

## Support

For technical support or questions about the referral system:
1. Check the admin dashboard for system status
2. Review error logs for specific issues
3. Verify database permissions and RLS policies
4. Test API endpoints individually

The referral system is now fully integrated and ready for use!
