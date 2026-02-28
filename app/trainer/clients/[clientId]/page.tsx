'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import ClientProfile from './ClientProfile'
import TrainingCycles from './TrainingCycles'
import Instructions from './Instructions'
import Trackers from '../../components/Trackers'

interface Client {
  id: string
  name: string
  email: string
  status: string
  joinDate: string
  lastActive: string
  avatar?: string | null
  isPersonal?: boolean
}

export default function ClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.clientId as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [currentView, setCurrentView] = useState<string>('profile')
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    fetchClient()
  }, [clientId])

  const fetchClient = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Handle personal training
      if (clientId === 'personal-use') {
        setClient({
          id: 'personal-use',
          name: 'Personal Training',
          email: user.email || 'trainer@example.com',
          status: 'active',
          joinDate: new Date().toISOString(),
          lastActive: 'Today',
          isPersonal: true
        })
        setLoading(false)
        return
      }

      // Fetch client from database using the new relationship table
      console.log('🔍 Fetching client relationship for:', { clientId, trainerId: user.id })
      
      let clientData: any = null
      let relationshipError: any = null

      try {
        const { data: relationshipData, error: relError } = await supabase
          .from('client_trainer_relationships')
          .select(`
            client:clients(*)
          `)
          .eq('client_id', clientId)
          .eq('trainer_id', user.id)
          .single()

        console.log('📊 Relationship query result:', { relationshipData, relError })

        if (!relError && relationshipData?.client) {
          clientData = relationshipData.client
          console.log('✅ Using relationship client data:', clientData)
        } else {
          relationshipError = relError
          console.log('🔄 Relationship lookup failed, trying fallback...')
        }
      } catch (tableError) {
        console.log('🔄 Relationship table might not exist, trying fallback...')
      }

      // Try fallback to direct client lookup
      if (!clientData) {
        console.log('🔄 Trying fallback to direct client lookup...')
        
        try {
          const { data: fallbackClient, error: fallbackError } = await supabase
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .eq('trainer_id', user.id)
            .single()

          console.log('📊 Fallback result:', { fallbackClient, fallbackError })

          if (fallbackError || !fallbackClient) {
            console.error('❌ Fallback also failed:', fallbackError)
            // Check if client exists but doesn't belong to this trainer
            const { data: clientExists } = await supabase
              .from('clients')
              .select('id, trainer_id')
              .eq('id', clientId)
              .single()

            if (clientExists) {
              console.error('❌ Client exists but belongs to different trainer:', clientExists)
              setClient(null)
              return
            } else {
              console.error('❌ Client does not exist in database')
              setClient(null)
              return
            }
          }

          // Use fallback client data
          clientData = fallbackClient
          console.log('✅ Using fallback client data:', clientData)
        } catch (fallbackError) {
          console.error('❌ Fallback lookup failed:', fallbackError)
          setClient(null)
          return
        }
      }

      const formattedClient: Client = {
        id: clientData.id,
        name: clientData.full_name || clientData.name,
        email: clientData.email,
        status: clientData.status || 'active',
        joinDate: clientData.created_at,
        lastActive: formatLastActive(clientData.updated_at),
        avatar: clientData.avatar_url,
        isPersonal: false
      }
      
      setClient(formattedClient)
    } catch (error) {
      console.error('Error fetching client:', error)
      setClient(null)
    } finally {
      setLoading(false)
    }
  }

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return '1 day ago'
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`
    return date.toLocaleDateString()
  }

  const handleNavigate = (view: string) => {
    if (view === 'training-cycles') {
      router.push(`/trainer/clients/${clientId}/training-cycles`)
    } else {
      setCurrentView(view)
    }
  }

  const handleBack = () => {
    if (currentView === 'profile') {
      router.push('/trainer/clients')
    } else {
      setCurrentView('profile')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5d90] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading client...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Client Not Found</h2>
            <p className="text-gray-600 mb-4">
              The client you're looking for doesn't exist or you don't have permission to access it.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Client ID: {clientId}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/trainer/clients')}
                className="w-full bg-[#2a5d90] text-white px-4 py-2 rounded-lg hover:bg-[#1e4a73] transition-colors"
              >
                Back to Clients
              </button>
              <button
                onClick={() => router.push('/debug/setup')}
                className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fix Database Issues
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (currentView === 'instructions') {
    return (
      <Instructions 
        clientId={clientId}
        onBack={handleBack}
      />
    )
  }

  if (currentView === 'trackers') {
    return (
      <Trackers 
        clientId={clientId}
        onBack={handleBack}
      />
    )
  }

  return (
    <ClientProfile 
      client={client}
      onNavigate={handleNavigate}
      onBack={handleBack}
    />
  )
}
