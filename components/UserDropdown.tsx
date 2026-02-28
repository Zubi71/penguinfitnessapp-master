'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserDropdownProps {
  userEmail?: string
  variant?: 'light' | 'dark'
  className?: string
}

export default function UserDropdown({ userEmail, variant = 'light', className = '' }: UserDropdownProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSettings = () => {
    router.push('/account')
  }

  const isDark = variant === 'dark'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
        isDark 
          ? 'hover:bg-[#1e4a73]' 
          : 'hover:bg-gray-100'
      } ${className}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isDark 
            ? 'bg-white/20' 
            : 'bg-[#2a5d90]'
        }`}>
          <User className="h-4 w-4 text-white" />
        </div>
        <ChevronDown className={`h-4 w-4 ${
          isDark 
            ? 'text-blue-200' 
            : 'text-gray-500'
        }`} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 text-sm text-gray-600 border-b">
          {userEmail}
        </div>
        <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
