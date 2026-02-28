import { ReactNode } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/auth/AuthGuard'
import { AuthProvider } from '@/hooks/auth/useAuth'

interface TrainerLayoutProps {
  children: ReactNode
}

export default function TrainerLayout({ children }: TrainerLayoutProps) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-gray-50">
        <Navbar />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto">
          <div className="max-w-6xl mx-auto h-full w-full">{children}</div>
        </main>
      </div>
    </AuthProvider>
  )
}