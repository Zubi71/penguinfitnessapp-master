'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import {
  Calendar, 
  MessageCircle, 
  TrendingUp, 
  Users, 
  Dumbbell, 
  Clock,
  Star,
  CheckCircle,
  Share2
} from 'lucide-react'
import UserDropdown from '@/components/UserDropdown'

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

export default function TrainerDashboard() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalSessions: 0,
    upcomingBookings: 0,
    unreadMessages: 0,
    completedWorkouts: 0,
    totalClients: 0,
    totalPrograms: 0
  })

  const [trainerName, setTrainerName] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setCurrentUser(user)

      // Fetch trainer name from trainers table
      const { data: trainerProfile } = await supabase
        .from('trainers')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single();
      if (trainerProfile) {
        setTrainerName(`${trainerProfile.first_name || ''} ${trainerProfile.last_name || ''}`.trim())
      }

      // Fetch clients from database
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('trainer_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })

      if (clientsError) {
        console.error('Error fetching clients:', clientsError)
      } else {
        const formattedClients = clientsData?.map(client => ({
          id: client.id,
          name: client.full_name || client.name,
          email: client.email,
          status: client.status || 'active',
          joinDate: client.created_at,
          lastActive: formatLastActive(client.updated_at),
          avatar: client.avatar_url,
          isPersonal: client.id === 'personal-use'
        })) || []
        
        setClients(formattedClients)
      }

      // Fetch workout sessions count
      const { count: sessionsCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('trainer_id', user.id)

      // Fetch upcoming bookings count
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('trainer_id', user.id)
        .eq('status', 'confirmed')
        .gte('session_date', new Date().toISOString())

      // Fetch unread messages count
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false)

      // Fetch completed workouts count
      const { count: completedCount } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('trainer_id', user.id)
        .eq('is_completed', true)

      // Fetch training programs count
      const { count: programsCount } = await supabase
        .from('training_programs')
        .select('*', { count: 'exact', head: true })
        .eq('trainer_id', user.id)

      setStats({
        totalSessions: sessionsCount || 0,
        upcomingBookings: bookingsCount || 0,
        unreadMessages: messagesCount || 0,
        completedWorkouts: completedCount || 0,
        totalClients: clientsData?.length || 0,
        totalPrograms: programsCount || 0
      })

    } catch (error) {
      console.error('Error fetching data:', error)
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

  const getStatsCards = () => [
    {
      title: 'Total Sessions',
      value: stats.totalSessions,
      icon: Dumbbell,
      color: 'bg-[#2a5d90]',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Upcoming Bookings',
      value: stats.upcomingBookings,
      icon: Calendar,
      color: 'bg-[#2a5d90]',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Unread Messages',
      value: stats.unreadMessages,
      icon: MessageCircle,
      color: 'bg-[#2a5d90]',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-[#2a5d90]',
      bgColor: 'bg-indigo-50'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2a5d90] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pt-6 sm:pt-10 px-4 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, Trainer{trainerName ? ` ${trainerName}` : ''}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your fitness journey today.
          </p>
        </div>
        
        {/* User Dropdown Menu */}
        <UserDropdown userEmail={currentUser?.email} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatsCards().map((card, index) => (
          <div key={index} className={`${card.bgColor} rounded-xl p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Clients */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Clients</h3>
            <button 
              onClick={() => router.push('/trainer/clients')}
              className="text-[#2a5d90] hover:text-[#1e4a73] text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {clients.length > 0 ? (
              clients.slice(0, 3).map((client) => (
                <button
                  key={client.id}
                  onClick={() => router.push(`/trainer/clients/${client.id}`)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#2a5d90] rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-600">{client.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Last active:</p>
                    <p className="text-sm text-gray-600">{client.lastActive}</p>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No recent clients</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center space-x-3 p-4 bg-[#2a5d90]/10 rounded-lg hover:bg-[#2a5d90]/20 transition-colors"
            >
              <Clock className="h-5 w-5 text-[#2a5d90]" />
              <span className="text-sm font-medium text-[#2a5d90]">Go to Dashboard</span>
            </button>
            <button 
              onClick={() => router.push('/trainer/clients')}
              className="w-full flex items-center space-x-3 p-4 bg-[#2a5d90]/10 rounded-lg hover:bg-[#2a5d90]/20 transition-colors"
            >
              <Users className="h-5 w-5 text-[#2a5d90]" />
              <span className="text-sm font-medium text-[#2a5d90]">Manage Clients</span>
            </button>
            <button 
              onClick={() => router.push('/trainer/handbook')}
              className="w-full flex items-center space-x-3 p-4 bg-[#2a5d90]/10 rounded-lg hover:bg-[#2a5d90]/20 transition-colors"
            >
              <Dumbbell className="h-5 w-5 text-[#2a5d90]" />
              <span className="text-sm font-medium text-[#2a5d90]">Handbook</span>
            </button>
            <button 
              onClick={() => router.push('/trainer/referrals')}
              className="w-full flex items-center space-x-3 p-4 bg-[#2a5d90]/10 rounded-lg hover:bg-[#2a5d90]/20 transition-colors"
            >
              <Share2 className="h-5 w-5 text-[#2a5d90]" />
              <span className="text-sm font-medium text-[#2a5d90]">Referrals</span>
            </button>
            <button 
              onClick={() => router.push('/trainer/availability')}
              className="w-full flex items-center space-x-3 p-4 bg-[#2a5d90]/10 rounded-lg hover:bg-[#2a5d90]/20 transition-colors"
            >
              <Clock className="h-5 w-5 text-[#2a5d90]" />
              <span className="text-sm font-medium text-[#2a5d90]">My Availability</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
