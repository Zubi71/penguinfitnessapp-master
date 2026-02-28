"use client"
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, User, Bell, Shield, CreditCard, Database } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Company Settings
    companyName: "Penguin Fitness",
    email: "fitness@penguinfitness.com",
    phone: "+65 8337 3038",
    address: "123 Pool Lane, Swimming City, SC 12345",
    website: "https://www.penguinfitness.sg",
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    classReminders: true,
    paymentReminders: true,
    
    // Business Settings
    defaultClassPrice: 35,
    currency: "USD",
    timezone: "America/New_York",
    classCapacity: 8,
    bookingWindow: 7, // days in advance
    cancellationWindow: 24, // hours before class
  });

  const handleSave = (category: string) => {
    console.log(`Saving ${category} settings:`, settings);
    // Here you would typically save to your backend/database
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-full sm:max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Manage your swim school preferences and configuration</p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="company" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="bg-white/80 backdrop-blur-sm border border-slate-200 min-w-max flex-nowrap">
              <TabsTrigger value="company" className="flex items-center gap-2 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                <User className="w-4 h-4" />
                Company
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                <Settings className="w-4 h-4" />
                Business
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2 whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Company Settings */}
          <TabsContent value="company">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={settings.phone}
                      onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={settings.website}
                      onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={settings.address}
                    onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                    className="resize-none"
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={() => handleSave('company')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 w-full sm:w-auto"
                >
                  Save Company Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <div>
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <p className="text-xs sm:text-sm text-slate-600">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <div>
                      <Label htmlFor="smsNotifications">SMS Notifications</Label>
                      <p className="text-xs sm:text-sm text-slate-600">Receive notifications via SMS</p>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsNotifications: checked }))}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <div>
                      <Label htmlFor="pushNotifications">Push Notifications</Label>
                      <p className="text-xs sm:text-sm text-slate-600">Receive browser push notifications</p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <div>
                      <Label htmlFor="classReminders">Class Reminders</Label>
                      <p className="text-xs sm:text-sm text-slate-600">Send reminders before classes</p>
                    </div>
                    <Switch
                      id="classReminders"
                      checked={settings.classReminders}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, classReminders: checked }))}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <div>
                      <Label htmlFor="paymentReminders">Payment Reminders</Label>
                      <p className="text-xs sm:text-sm text-slate-600">Send reminders for due payments</p>
                    </div>
                    <Switch
                      id="paymentReminders"
                      checked={settings.paymentReminders}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, paymentReminders: checked }))}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => handleSave('notifications')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 w-full sm:w-auto"
                >
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Settings */}
          <TabsContent value="business">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Business Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultClassPrice">Default Class Price ($)</Label>
                    <Input
                      id="defaultClassPrice"
                      type="number"
                      value={settings.defaultClassPrice}
                      onChange={(e) => setSettings(prev => ({ ...prev, defaultClassPrice: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={settings.currency}
                      onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classCapacity">Default Class Capacity</Label>
                    <Input
                      id="classCapacity"
                      type="number"
                      value={settings.classCapacity}
                      onChange={(e) => setSettings(prev => ({ ...prev, classCapacity: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={settings.timezone}
                      onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bookingWindow">Booking Window (days)</Label>
                    <Input
                      id="bookingWindow"
                      type="number"
                      value={settings.bookingWindow}
                      onChange={(e) => setSettings(prev => ({ ...prev, bookingWindow: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cancellationWindow">Cancellation Window (hours)</Label>
                    <Input
                      id="cancellationWindow"
                      type="number"
                      value={settings.cancellationWindow}
                      onChange={(e) => setSettings(prev => ({ ...prev, cancellationWindow: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => handleSave('business')}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 w-full sm:w-auto"
                >
                  Save Business Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Security Settings</span>
                    </div>
                    <p className="text-xs sm:text-sm text-yellow-700">
                      Security settings are managed through your authentication provider. 
                      Contact your administrator for password changes and two-factor authentication setup.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Data Backup</span>
                    </div>
                    <p className="text-xs sm:text-sm text-blue-700 mb-3">
                      Your data is automatically backed up daily. You can also export your data manually.
                    </p>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                      Export Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
