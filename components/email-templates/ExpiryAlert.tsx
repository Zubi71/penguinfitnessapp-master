import * as React from 'react';

interface ExpiryAlertProps {
  firstName: string;
  lastName: string;
  alertType: 'subscription_expiry' | 'payment_due' | 'top_up_reminder' | 'membership_expiry' | 'package_expiry';
  daysRemaining?: number;
  expiryDate?: string;
  amount?: number;
  currency?: string;
  packageName?: string;
  membershipType?: string;
  actionUrl?: string;
  companyName?: string;
  logoUrl?: string;
}

export function ExpiryAlert({
  firstName,
  lastName,
  alertType,
  daysRemaining = 7,
  expiryDate,
  amount,
  currency = 'USD',
  packageName,
  membershipType,
  actionUrl,
  companyName = 'Penguin Fitness',
  logoUrl
}: ExpiryAlertProps) {
  
  const getAlertTitle = () => {
    switch (alertType) {
      case 'subscription_expiry':
        return 'Subscription Expiring Soon';
      case 'payment_due':
        return 'Payment Due Reminder';
      case 'top_up_reminder':
        return 'Top-up Reminder';
      case 'membership_expiry':
        return 'Membership Expiring Soon';
      case 'package_expiry':
        return 'Package Expiring Soon';
      default:
        return 'Important Alert';
    }
  };

  const getAlertMessage = () => {
    const name = `${firstName} ${lastName}`;
    
    switch (alertType) {
      case 'subscription_expiry':
        return `Hi ${firstName}, your subscription is expiring in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Renew now to continue enjoying our services without interruption.`;
      case 'payment_due':
        return `Hi ${firstName}, a payment of ${currency}${amount} is due. Please complete your payment to maintain uninterrupted access to our services.`;
      case 'top_up_reminder':
        return `Hi ${firstName}, your account balance is running low. Consider topping up to ensure continuous access to our premium services.`;
      case 'membership_expiry':
        return `Hi ${firstName}, your ${membershipType} membership is expiring in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Renew to keep your benefits active.`;
      case 'package_expiry':
        return `Hi ${firstName}, your ${packageName} package is expiring in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Extend your package to continue your fitness journey.`;
      default:
        return `Hi ${firstName}, you have an important alert regarding your account.`;
    }
  };

  const getActionButtonText = () => {
    switch (alertType) {
      case 'subscription_expiry':
        return 'Renew Subscription';
      case 'payment_due':
        return 'Pay Now';
      case 'top_up_reminder':
        return 'Top Up Account';
      case 'membership_expiry':
        return 'Renew Membership';
      case 'package_expiry':
        return 'Extend Package';
      default:
        return 'Take Action';
    }
  };

  const getUrgencyColor = () => {
    if (daysRemaining <= 3) return '#dc2626'; // Red for urgent
    if (daysRemaining <= 7) return '#ea580c'; // Orange for warning
    return '#059669'; // Green for normal
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#1f2937',
        padding: '24px',
        textAlign: 'center'
      }}>
        {logoUrl && (
          <img 
            src={logoUrl} 
            alt={`${companyName} Logo`}
            style={{
              height: '40px',
              marginBottom: '16px'
            }}
          />
        )}
        <h1 style={{
          color: '#ffffff',
          margin: '0',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          {companyName}
        </h1>
      </div>

      {/* Alert Banner */}
      <div style={{
        backgroundColor: getUrgencyColor(),
        color: '#ffffff',
        padding: '16px 24px',
        textAlign: 'center'
      }}>
        <h2 style={{
          margin: '0',
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          ⚠️ {getAlertTitle()}
        </h2>
      </div>

      {/* Main Content */}
      <div style={{ padding: '32px 24px' }}>
        <p style={{
          fontSize: '16px',
          lineHeight: '1.6',
          color: '#374151',
          marginBottom: '24px'
        }}>
          {getAlertMessage()}
        </p>

        {/* Details Box */}
        <div style={{
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '18px',
            color: '#111827',
            fontWeight: '600'
          }}>
            Details
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            {expiryDate && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Expiry Date:</span>
                <span style={{ fontWeight: '500', color: '#111827' }}>
                  {new Date(expiryDate).toLocaleDateString()}
                </span>
              </div>
            )}
            
            {daysRemaining && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Days Remaining:</span>
                <span style={{ 
                  fontWeight: '500', 
                  color: daysRemaining <= 3 ? '#dc2626' : daysRemaining <= 7 ? '#ea580c' : '#059669'
                }}>
                  {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            
            {amount && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Amount Due:</span>
                <span style={{ fontWeight: '500', color: '#111827' }}>
                  {currency}${amount.toFixed(2)}
                </span>
              </div>
            )}
            
            {packageName && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Package:</span>
                <span style={{ fontWeight: '500', color: '#111827' }}>
                  {packageName}
                </span>
              </div>
            )}
            
            {membershipType && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Membership:</span>
                <span style={{ fontWeight: '500', color: '#111827' }}>
                  {membershipType}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {actionUrl && (
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <a 
              href={actionUrl}
              style={{
                display: 'inline-block',
                backgroundColor: getUrgencyColor(),
                color: '#ffffff',
                padding: '14px 32px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '16px',
                textAlign: 'center',
                minWidth: '200px'
              }}
            >
              {getActionButtonText()}
            </a>
          </div>
        )}

        {/* Additional Info */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <p style={{
            margin: '0',
            fontSize: '14px',
            color: '#92400e',
            lineHeight: '1.5'
          }}>
            <strong>Need help?</strong> Contact our support team at support@{companyName.toLowerCase().replace(/\s+/g, '')}.com or call us at +1 (555) 123-4567
          </p>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: '24px',
          textAlign: 'center'
        }}>
          <p style={{
            margin: '0',
            fontSize: '14px',
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            Thank you for choosing {companyName}.<br />
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  );
} 