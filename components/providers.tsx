'use client'

import { AuthProvider } from '@/hooks/auth/useAuth'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster />
    </AuthProvider>
  )
}
