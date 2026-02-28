import React, { useState } from 'react'
import { 
  Search, 
  Plus, 
  User, 
  Filter,
  HelpCircle,
  X,
  Mail,
  Phone,
  Calendar
} from 'lucide-react'

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

interface ClientsHomepageProps {
  clients: Client[]
  onSelectClient: (client: Client) => void
  onAddClient: (client: { name: string; email: string; phone?: string }) => void
}

const ClientsHomepage: React.FC<ClientsHomepageProps> = ({ 
  clients, 
  onSelectClient, 
  onAddClient 
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    phone: ''
  })

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault()
    if (newClientData.name && newClientData.email) {
      onAddClient(newClientData)
      setNewClientData({ name: '', email: '', phone: '' })
      setShowAddModal(false)
    }
  }

  const getClientInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-4xl">
      {/* Header */}
          <div className="px-6 py-4">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#2a5d90] font-bold text-lg">FT</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold">Fitness Training</h1>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-sm">Welcome</p>
              <p className="font-semibold">Trainer Dashboard</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">MY CLIENTS</h2>
            <div className="flex items-center space-x-2">
              <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                SLOTS: {clients.length} / 50
              </span>
              <HelpCircle className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#2a5d90] hover:bg-[#1e4a73] text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Client</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for a client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a5d90] focus:border-transparent"
              />
            </div>
            <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Clients List */}
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => onSelectClient(client)}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    {client.avatar ? (
                      <img 
                        src={client.avatar} 
                        alt={client.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold">
                        {getClientInitials(client.name)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                    <p className="text-gray-500 text-sm">{client.email}</p>
                    <p className="text-gray-400 text-xs">Last active: {client.lastActive}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {client.isPersonal && (
                    <div className="w-6 h-6 bg-[#2a5d90] rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    client.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {client.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search criteria.' 
                : 'Add your first client to get started with training management.'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}                  className="bg-[#2a5d90] hover:bg-[#1e4a73] text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Add Your First Client</span>
              </button>
            )}
          </div>
        )}

        {/* View Tutorials */}
        <div className="text-center mt-8">
          <button className="text-gray-500 hover:text-gray-700 flex items-center space-x-2 mx-auto">
            <span>View Tutorials</span>
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add New Client</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    required
                    value={newClientData.name}
                    onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a5d90] focus:border-transparent"
                    placeholder="Enter client's full name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    required
                    value={newClientData.email}
                    onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a5d90] focus:border-transparent"
                    placeholder="Enter client's email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    value={newClientData.phone}
                    onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a5d90] focus:border-transparent"
                    placeholder="Enter client's phone number"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#2a5d90] text-white rounded-lg hover:bg-[#1e4a73] transition-colors"
                >
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default ClientsHomepage
