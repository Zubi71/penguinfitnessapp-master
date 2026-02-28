'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import ClientsHomepage from './ClientsHomepage'

interface Client {
  id: string
  name: string
  email: string
  status: string
  joinDate: string
  lastActive: string
  avatar?: string | null
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      console.log('🔍 Current user:', user.id, user.email)

      // Try to fetch clients directly using user.id first
      let { data: clientsData, error } = await supabase
        .from('clients')
        .select('*')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })

      console.log('📊 Direct query - Raw clients data:', clientsData)
      console.log('❌ Direct query - Clients error:', error)

      // If no clients found with direct user.id, try with trainer table lookup
      if ((!clientsData || clientsData.length === 0) && !error) {
        console.log('🔄 No clients found with user.id, trying trainer table lookup...')
        
        // Get trainer ID first
        const { data: trainerData, error: trainerError } = await supabase
          .from('trainers')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (trainerError || !trainerData) {
          console.error('❌ Error fetching trainer data:', trainerError)
        } else {
          console.log('👨‍🏫 Trainer data:', trainerData)
          
          // Try with trainer table ID
          const { data: trainerClientsData, error: trainerClientsError } = await supabase
            .from('clients')
            .select('*')
            .eq('trainer_id', trainerData.id)
            .order('created_at', { ascending: false })

          console.log('📊 Trainer lookup - Raw clients data:', trainerClientsData)
          console.log('❌ Trainer lookup - Clients error:', trainerClientsError)
          
          if (trainerClientsData && trainerClientsData.length > 0) {
            clientsData = trainerClientsData
            error = trainerClientsError
          }
        }
      }

      if (error) {
        console.error('Error fetching clients:', error)
        return
      }

      const formattedClients: Client[] = clientsData?.map(client => ({
        id: client.id,
        name: client.full_name || client.name || `${client.first_name} ${client.last_name}`.trim(),
        email: client.email,
        status: client.status || 'active',
        joinDate: client.created_at,
        lastActive: formatLastActive(client.updated_at || client.created_at),
        avatar: client.avatar_url
      })) || []
      
      console.log('✅ Formatted clients:', formattedClients)
      setClients(formattedClients)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatLastActive = (dateString: string) => {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return '1 day ago'
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`
    return date.toLocaleDateString()
  }

  const handleSelectClient = (client: Client) => {
    router.push(`/trainer/clients/${client.id}`)
  }

  const handleAddClient = async (userEmail: string) => {
    try {
      const response = await fetch('/api/trainer/add-client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientEmail: userEmail }),
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok) {
        alert(`Failed to add client: ${result.error}`)
        return
      }

      if (result.success && result.client) {
        // Add to local state
        const newClient: Client = {
          id: result.client.id,
          name: result.client.name,
          email: result.client.email,
          status: result.client.status,
          joinDate: result.client.joinDate,
          lastActive: result.client.lastActive,
          avatar: result.client.avatar
        }
        
        setClients(prev => [newClient, ...prev])
        alert('Client successfully added to your list!')
      }
      
    } catch (error) {
      console.error('Unexpected error adding client:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to add client: ${errorMessage}. Please try again.`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5d90] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    )
  }

  return (
    <ClientsHomepage 
      clients={clients}
      onSelectClient={handleSelectClient}
      onAddClient={handleAddClient}
    />
  )
}
