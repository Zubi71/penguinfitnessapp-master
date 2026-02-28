import { createClient } from '@/utils/supabase/server';

export interface ExpiryAlertData {
  to: string;
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

export class ExpiryAlertService {
  /**
   * Send an expiry alert email
   */
  static async sendAlert(alertData: ExpiryAlertData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-expiry-alert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send alert');
      }

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Error sending expiry alert:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check for expiring subscriptions and send alerts
   */
  static async checkAndSendSubscriptionAlerts(): Promise<{ sent: number; errors: number }> {
    try {
      const supabase = await createClient();
      // Get clients with expiring subscriptions (example query - adjust based on your schema)
      const { data: expiringSubscriptions, error } = await supabase
        .from('client_signups')
        .select(`
          id,
          first_name,
          last_name,
          email,
          status,
          trainer_id
        `)
        .eq('status', 'enrolled')
        .not('email', 'is', null);

      if (error) {
        console.error('Error fetching expiring subscriptions:', error);
        return { sent: 0, errors: 1 };
      }

      let sent = 0;
      let errors = 0;

      for (const client of expiringSubscriptions || []) {
        try {
          // Calculate days remaining (example logic - adjust based on your subscription data)
          const daysRemaining = this.calculateDaysRemaining(client);
          
          if (daysRemaining <= 7 && daysRemaining > 0) {
            const alertData: ExpiryAlertData = {
              to: client.email,
              firstName: client.first_name,
              lastName: client.last_name,
              alertType: 'subscription_expiry',
              daysRemaining,
              expiryDate: this.getExpiryDate(client),
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account/renew`,
              companyName: 'Penguin Fitness',
            };

            const result = await this.sendAlert(alertData);
            if (result.success) {
              sent++;
            } else {
              errors++;
            }
          }
        } catch (error) {
          console.error(`Error processing client ${client.id}:`, error);
          errors++;
        }
      }

      return { sent, errors };
    } catch (error) {
      console.error('Error in checkAndSendSubscriptionAlerts:', error);
      return { sent: 0, errors: 1 };
    }
  }

  /**
   * Check for overdue payments and send payment due alerts
   */
  static async checkAndSendPaymentAlerts(): Promise<{ sent: number; errors: number }> {
    try {
      const supabase = await createClient();
      // Get overdue payments
      const { data: overduePayments, error } = await supabase
        .from('payments')
        .select(`
          *,
          client:client_signups(first_name, last_name, email)
        `)
        .eq('status', 'pending')
        .lt('due_date', new Date().toISOString().split('T')[0]);

      if (error) {
        console.error('Error fetching overdue payments:', error);
        return { sent: 0, errors: 1 };
      }

      let sent = 0;
      let errors = 0;

      for (const payment of overduePayments || []) {
        if (payment.client?.email) {
          try {
            const alertData: ExpiryAlertData = {
              to: payment.client.email,
              firstName: payment.client.first_name,
              lastName: payment.client.last_name,
              alertType: 'payment_due',
              amount: payment.amount,
              currency: payment.currency || 'USD',
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account/billing`,
              companyName: 'Penguin Fitness',
            };

            const result = await this.sendAlert(alertData);
            if (result.success) {
              sent++;
            } else {
              errors++;
            }
          } catch (error) {
            console.error(`Error processing payment ${payment.id}:`, error);
            errors++;
          }
        }
      }

      return { sent, errors };
    } catch (error) {
      console.error('Error in checkAndSendPaymentAlerts:', error);
      return { sent: 0, errors: 1 };
    }
  }

  /**
   * Send a custom expiry alert
   */
  static async sendCustomAlert(
    email: string,
    firstName: string,
    lastName: string,
    alertType: ExpiryAlertData['alertType'],
    options: Partial<ExpiryAlertData> = {}
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const alertData: ExpiryAlertData = {
      to: email,
      firstName,
      lastName,
      alertType,
      companyName: 'Penguin Fitness',
      ...options,
    };

    return this.sendAlert(alertData);
  }

  /**
   * Calculate days remaining until expiry (example implementation)
   */
  private static calculateDaysRemaining(client: any): number {
    // This is an example implementation
    // You'll need to adjust this based on your actual subscription data structure
    const today = new Date();
    const expiryDate = new Date(); // Replace with actual expiry date from your data
    expiryDate.setDate(expiryDate.getDate() + 30); // Example: 30 days from now
    
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * Get expiry date (example implementation)
   */
  private static getExpiryDate(client: any): string {
    // This is an example implementation
    // You'll need to adjust this based on your actual subscription data structure
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Example: 30 days from now
    return expiryDate.toISOString().split('T')[0];
  }

  /**
   * Send top-up reminder
   */
  static async sendTopUpReminder(
    email: string,
    firstName: string,
    lastName: string,
    currentBalance: number
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendCustomAlert(email, firstName, lastName, 'top_up_reminder', {
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account/top-up`,
    });
  }

  /**
   * Send membership expiry alert
   */
  static async sendMembershipExpiryAlert(
    email: string,
    firstName: string,
    lastName: string,
    membershipType: string,
    daysRemaining: number,
    expiryDate: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendCustomAlert(email, firstName, lastName, 'membership_expiry', {
      membershipType,
      daysRemaining,
      expiryDate,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account/membership`,
    });
  }

  /**
   * Send package expiry alert
   */
  static async sendPackageExpiryAlert(
    email: string,
    firstName: string,
    lastName: string,
    packageName: string,
    daysRemaining: number,
    expiryDate: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendCustomAlert(email, firstName, lastName, 'package_expiry', {
      packageName,
      daysRemaining,
      expiryDate,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account/packages`,
    });
  }
} 