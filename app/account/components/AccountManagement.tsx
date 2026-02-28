'use client'

import React, { useState } from 'react'
import { User, Settings, CreditCard, Bell, Shield, HelpCircle, LogOut, ChevronRight, Camera, Save, Edit3 } from 'lucide-react'

interface AccountManagementProps {
  user: any
}

const AccountManagement: React.FC<AccountManagementProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: user?.user_metadata?.first_name || 'John',
    lastName: user?.user_metadata?.last_name || 'Doe',
    email: user?.email || 'john.doe@example.com',
    phone: user?.user_metadata?.phone || '+1 (555) 123-4567',
    bio: user?.user_metadata?.bio || 'Certified fitness trainer with 5+ years of experience in strength training and nutrition.',
    specializations: user?.user_metadata?.specializations || ['Strength Training', 'Weight Loss', 'Nutrition'],
    certifications: user?.user_metadata?.certifications || ['NASM-CPT', 'CSCS', 'Nutrition Coach']
  })

  const menuItems = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'settings', label: 'Account Settings', icon: Settings },
    { id: 'billing', label: 'Billing & Payment', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ]

  const handleSaveProfile = () => {
    setIsEditing(false)
    // Add save logic here
    console.log('Profile saved:', profileData)
  }

  const renderProfileSection = () => (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Profile Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <Edit3 className="h-4 w-4" />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Profile Picture */}
        <div className="flex items-center space-x-6 mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-red-500" />
            </div>
            {isEditing && (
              <button className="absolute -bottom-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600">
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {profileData.firstName} {profileData.lastName}
            </h3>
            <p className="text-gray-500">Fitness Trainer</p>
            <p className="text-sm text-gray-400">Member since January 2024</p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input
              type="text"
              value={profileData.firstName}
              onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input
              type="text"
              value={profileData.lastName}
              onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea
            value={profileData.bio}
            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
            disabled={!isEditing}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
            <div className="space-y-2">
              {profileData.specializations.map((spec: string, index: number) => (
                <div key={index} className="flex items-center">
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                    {spec}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
            <div className="space-y-2">
              {profileData.certifications.map((cert: string, index: number) => (
                <div key={index} className="flex items-center">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {cert}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end mt-8">
            <button
              onClick={handleSaveProfile}
              className="flex items-center space-x-2 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const renderSettingsSection = () => (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Language</h3>
              <p className="text-gray-500">Choose your preferred language</p>
            </div>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500">
              <option>English (US)</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Time Zone</h3>
              <p className="text-gray-500">Set your local time zone</p>
            </div>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500">
              <option>UTC-05:00 Eastern Time</option>
              <option>UTC-06:00 Central Time</option>
              <option>UTC-07:00 Mountain Time</option>
              <option>UTC-08:00 Pacific Time</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Email Preferences</h3>
              <p className="text-gray-500">Control what emails you receive</p>
            </div>
            <button className="text-red-500 hover:text-red-600 font-medium">
              Manage
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderBillingSection = () => (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Billing & Payment</h2>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Current Plan</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">Pro Trainer</p>
                <p className="text-gray-500">$29.99/month</p>
              </div>
              <button className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                Upgrade
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">
                    VISA
                  </div>
                  <div>
                    <p className="font-medium">**** **** **** 4242</p>
                    <p className="text-sm text-gray-500">Expires 12/26</p>
                  </div>
                </div>
                <button className="text-red-500 hover:text-red-600">
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificationsSection = () => (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Notification Settings</h2>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {[
            { title: 'Email Notifications', desc: 'Receive updates via email' },
            { title: 'Push Notifications', desc: 'Receive push notifications on your device' },
            { title: 'SMS Notifications', desc: 'Receive text message alerts' },
            { title: 'New Client Assignments', desc: 'Get notified when assigned new clients' },
            { title: 'Class Reminders', desc: 'Receive reminders about upcoming classes' },
            { title: 'Payment Updates', desc: 'Get notified about payment status changes' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSecuritySection = () => (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Security & Privacy</h2>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
              <p className="text-gray-500">Update your account password</p>
            </div>
            <button className="text-red-500 hover:text-red-600 font-medium">
              Change
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
              <p className="text-gray-500">Add an extra layer of security</p>
            </div>
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
              Enable
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Login History</h3>
              <p className="text-gray-500">View recent login activity</p>
            </div>
            <button className="text-red-500 hover:text-red-600 font-medium">
              View
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Data Export</h3>
              <p className="text-gray-500">Download a copy of your data</p>
            </div>
            <button className="text-red-500 hover:text-red-600 font-medium">
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderHelpSection = () => (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Help & Support</h2>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {[
            { title: 'Help Center', desc: 'Browse frequently asked questions and guides' },
            { title: 'Contact Support', desc: 'Get in touch with our support team' },
            { title: 'Feature Requests', desc: 'Suggest new features or improvements' },
            { title: 'Report a Bug', desc: 'Let us know about any issues you encounter' },
            { title: 'Community Forum', desc: 'Connect with other trainers and users' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileSection()
      case 'settings': return renderSettingsSection()
      case 'billing': return renderBillingSection()
      case 'notifications': return renderNotificationsSection()
      case 'security': return renderSecuritySection()
      case 'help': return renderHelpSection()
      default: return renderProfileSection()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-500 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold">Account Management</h1>
          <p className="text-red-100 mt-2">Manage your profile, settings, and preferences</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === item.id
                          ? 'bg-red-500 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  )
                })}
                <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 border-t border-gray-200 mt-4 pt-4">
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountManagement
