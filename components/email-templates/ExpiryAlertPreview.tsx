'use client';

import React, { useState } from 'react';
import { ExpiryAlert } from './ExpiryAlert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AlertConfig {
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

export function ExpiryAlertPreview() {
  const [config, setConfig] = useState<AlertConfig>({
    firstName: 'John',
    lastName: 'Doe',
    alertType: 'subscription_expiry',
    daysRemaining: 3,
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amount: 99.99,
    currency: 'USD',
    packageName: 'Swimming Lessons Package',
    membershipType: 'Premium',
    actionUrl: 'https://example.com/renew',
    companyName: 'Penguin Fitness',
  });

  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string }>({});

  const handleConfigChange = (field: keyof AlertConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      setResult({ success: false, error: 'Please enter an email address' });
      return;
    }

    setIsSending(true);
    setResult({});

    try {
      const response = await fetch('/api/test-expiry-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testType: config.alertType,
          email: testEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, message: data.message });
      } else {
        setResult({ success: false, error: data.error });
      }
    } catch (error) {
      setResult({ success: false, error: 'Failed to send test email' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Expiry Alert Email Preview</h1>
        <p className="text-gray-600">Test and preview different expiry alert email templates</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={config.firstName}
                  onChange={(e) => handleConfigChange('firstName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={config.lastName}
                  onChange={(e) => handleConfigChange('lastName', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="alertType">Alert Type</Label>
              <Select
                value={config.alertType}
                onValueChange={(value) => handleConfigChange('alertType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription_expiry">Subscription Expiry</SelectItem>
                  <SelectItem value="payment_due">Payment Due</SelectItem>
                  <SelectItem value="top_up_reminder">Top-up Reminder</SelectItem>
                  <SelectItem value="membership_expiry">Membership Expiry</SelectItem>
                  <SelectItem value="package_expiry">Package Expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="daysRemaining">Days Remaining</Label>
                <Input
                  id="daysRemaining"
                  type="number"
                  value={config.daysRemaining || ''}
                  onChange={(e) => handleConfigChange('daysRemaining', parseInt(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={config.amount || ''}
                  onChange={(e) => handleConfigChange('amount', parseFloat(e.target.value) || undefined)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={config.expiryDate || ''}
                onChange={(e) => handleConfigChange('expiryDate', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="packageName">Package Name</Label>
                <Input
                  id="packageName"
                  value={config.packageName || ''}
                  onChange={(e) => handleConfigChange('packageName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="membershipType">Membership Type</Label>
                <Input
                  id="membershipType"
                  value={config.membershipType || ''}
                  onChange={(e) => handleConfigChange('membershipType', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="actionUrl">Action URL</Label>
              <Input
                id="actionUrl"
                value={config.actionUrl || ''}
                onChange={(e) => handleConfigChange('actionUrl', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={config.companyName || ''}
                onChange={(e) => handleConfigChange('companyName', e.target.value)}
              />
            </div>

            {/* Test Email Section */}
            <div className="border-t pt-4">
              <Label htmlFor="testEmail">Test Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="Enter email to send test"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <Button
                onClick={sendTestEmail}
                disabled={isSending || !testEmail}
                className="w-full mt-2"
              >
                {isSending ? 'Sending...' : 'Send Test Email'}
              </Button>
              
              {result.message && (
                <div className={`mt-2 p-2 rounded text-sm ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {result.message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <ExpiryAlert {...config} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 