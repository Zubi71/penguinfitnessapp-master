'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Target, FileText, Users, MessageSquare, Share2 } from 'lucide-react'
import UserDropdown from '@/components/UserDropdown'

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const navItems: NavItem[] = [
  { href: '/client', icon: Home, label: 'Dashboard' },
  { href: '/client/training', icon: Target, label: 'Training' },
  { href: '/client/tracker', icon: Calendar, label: 'Tracker' },
  { href: '/client/instructions', icon: FileText, label: 'Instructions' },
  { href: '/client/community-events', icon: Users, label: 'Community Events' },
  { href: '/client/referrals', icon: Share2, label: 'Referrals' },
  { href: '/client/feedback', icon: MessageSquare, label: 'Feedback' },
]

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/client" className="flex items-center space-x-3">
                <Image 
                  src="/logo.png" 
                  alt="Penguin Fitness Logo" 
                  width={32} 
                  height={32} 
                  className="rounded-full"
                />
                <h1 className="text-xl font-semibold text-gray-900">Client Portal</h1>
              </Link>
            </div>
            <UserDropdown />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                    isActive
                      ? 'border-[#2a5d90] text-[#2a5d90]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
