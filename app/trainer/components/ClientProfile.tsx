import React, { useState } from 'react'
import { 
  User, 
  Mail, 
  Calendar,
  Dumbbell,
  FileText,
  TrendingUp,
  ChevronRight,
  Plus,
  ArrowLeft
} from 'lucide-react'

interface ClientProfileProps {
  client: {
    id: string
    name: string
    email: string
    status: string
    joinDate: string
    lastActive: string
    avatar?: string | null
    isPersonal?: boolean
  }
  onNavigate: (view: string) => void
  onBack: () => void
}

const ClientProfile: React.FC<ClientProfileProps> = ({ client, onNavigate, onBack }) => {
  const [reminders, setReminders] = useState('')

  const menuItems = [
    {
      id: 'training-cycles',
      title: 'Training Cycles',
      icon: Dumbbell,
      color: 'bg-[#2a5d90]',
      description: 'Manage workout programs and cycles'
    },
    {
      id: 'instructions',
      title: 'Instructions',
      icon: FileText,
      color: 'bg-[#2a5d90]',
      description: 'Exercise instructions and form guides'
    },
    {
      id: 'trackers',
      title: 'Trackers',
      icon: TrendingUp,
      color: 'bg-[#2a5d90]',
      description: 'Progress tracking and measurements'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-4xl">
      {/* Header */}
      <div className="bg-[#2a5d90] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={onBack} className="p-2 hover:bg-[#1e4a73] rounded-lg">
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{client.name}</h1>
                <p className="text-blue-100">Client Profile</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-100">Last Active</p>
              <p className="font-semibold">{client.lastActive}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Client Info Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Client Information</h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium capitalize">
              {client.status}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{client.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Join Date</p>
                <p className="font-medium">{new Date(client.joinDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reminders Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="bg-gray-800 text-white text-center py-3 rounded-lg mb-4">
            <h3 className="font-semibold">REMINDERS</h3>
          </div>
          
          <div className="min-h-32 border-2 border-dashed border-gray-200 rounded-lg p-4 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 italic mb-4">Add a reminder/note for your client here!</p>
              <textarea
                value={reminders}
                onChange={(e) => setReminders(e.target.value)}
                placeholder="Type your reminder here..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a5d90] focus:border-transparent"
                rows={3}
              />
            </div>
          </div>
          
          {/* Pagination dots */}
          <div className="flex justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-2">
          {['CAL', 'P', 'F', 'C', '💧'].map((stat, index) => (
            <div key={index} className={`p-4 rounded-lg text-center ${
              index === 0 ? 'bg-[#2a5d90]/10 text-[#2a5d90]' :
              index === 1 ? 'bg-pink-100 text-pink-800' :
              index === 2 ? 'bg-yellow-100 text-yellow-800' :
              index === 3 ? 'bg-green-100 text-green-800' :
              'bg-purple-100 text-purple-800'
            }`}>
              <p className="font-semibold">{stat}</p>
              <p className="text-sm">-</p>
            </div>
          ))}
        </div>

        {/* Menu Items */}
        <div className="space-y-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full bg-white rounded-lg shadow-sm p-6 flex items-center space-x-4 hover:shadow-md transition-shadow"
            >
              <div className={`${item.color} p-3 rounded-lg`}>
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          ))}
        </div>

        {/* Deactivate Button */}
        <button className="w-full bg-[#2a5d90] text-white py-3 rounded-lg font-semibold hover:bg-[#1e4a73] transition-colors">
          Deactivate Client
        </button>
      </div>
      </div>
    </div>
  )
}

export default ClientProfile
