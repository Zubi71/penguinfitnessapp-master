import React, { useState, useEffect, useRef } from 'react'
import { 
  Search, 
  Plus, 
  User, 
  Filter,
  HelpCircle,
  X,
  Mail,
  Phone,
  ArrowLeft,
  UserPlus,
  AlertCircle,
  ChevronDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  onAddClient: (userEmail: string) => void
}

const ClientsHomepage: React.FC<ClientsHomepageProps> = ({ 
  clients, 
  onSelectClient, 
  onAddClient 
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userError, setUserError] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Fetch available users when modal opens
  useEffect(() => {
    if (showAddModal) {
      fetchAvailableUsers()
    }
  }, [showAddModal])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true)
    setUserError('')
    setAvailableUsers([])

    try {
      console.log('🔍 Fetching available clients...')
      const response = await fetch('/api/get-available-clients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      console.log('📡 Response status:', response.status)
      console.log('� Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        
        try {
          const errorJson = JSON.parse(errorText)
          setUserError(errorJson.error || `HTTP ${response.status}: ${response.statusText}`)
        } catch {
          setUserError(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
        }
        return
      }

      const result = await response.json()
      console.log('📋 API Response:', result)

      console.log('✅ Available users found:', result.users?.length || 0)
      setAvailableUsers(result.users || [])
    } catch (error) {
      console.error('❌ Network error details:', error)
      setUserError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedUser) {
      onAddClient(selectedUser.email)
      resetModal()
    }
  }

  const resetModal = () => {
    setSelectedUser(null)
    setAvailableUsers([])
    setUserError('')
    setLoadingUsers(false)
    setShowDropdown(false)
    setShowAddModal(false)
  }

  const handleUserSelect = (user: any) => {
    setSelectedUser(user)
    setShowDropdown(false)
  }

  const getClientInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="min-h-screen flex justify-center">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="bg-[var(--primary)] text-white p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => router.push("/trainer")} 
                  className="p-2 hover:bg-[color:#1e4a73] rounded-lg"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-xl font-semibold">My Clients</h1>
                </div>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Dashboard</p>
                <p className="font-semibold">Training Management</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">MY CLIENTS</h2>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-[var(--primary)] hover:bg-[color:#1e4a73] text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Existing Client</span>
            </button>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search for a client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a5d90] focus:border-transparent"
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
                      <div className="w-6 h-6 bg-[var(--primary)] rounded-full flex items-center justify-center">
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
                  onClick={() => setShowAddModal(true)}
                  className="bg-[var(--primary)] hover:bg-[color:#1e4a73] text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
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
                <h3 className="text-lg font-semibold text-gray-900">Add Existing Client</h3>
                <button
                  onClick={resetModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-[#2a5d90] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#2a5d90]">Note</p>
                    <p className="text-sm text-gray-700">
                      You can only add clients who are already registered in the system. 
                      Ask them to register first at the client registration page.
                    </p>
                  </div>
                </div>
              </div>

              {/* Debug buttons - temporary */}
              <div className="mb-4 space-y-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/test-auth', { credentials: 'include' })
                      const data = await response.json()
                      console.log('🧪 Test auth response:', data)
                      alert(`Auth test: ${data.success ? 'SUCCESS' : 'FAILED'} - Check console`)
                    } catch (error) {
                      console.error('Test auth error:', error)
                      alert('Auth test failed - Check console')
                    }
                  }}
                  className="text-xs bg-green-200 px-3 py-1 rounded text-green-800 hover:bg-green-300 mr-2"
                >
                  Test Auth API
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/debug-users', { credentials: 'include' })
                      const data = await response.json()
                      console.log('🐛 Debug data:', data)
                      alert('Check console for debug information')
                    } catch (error) {
                      console.error('Debug error:', error)
                      alert('Debug failed - Check console')
                    }
                  }}
                  className="text-xs bg-gray-200 px-3 py-1 rounded text-gray-700 hover:bg-gray-300"
                >
                  Debug User Data
                </button>
              </div>

              <form onSubmit={handleAddClient} className="space-y-4">
                <div>
                  <label htmlFor="clientSelect" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Client *
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowDropdown(!showDropdown)}
                      disabled={loadingUsers}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2a5d90] focus:border-transparent text-left flex items-center justify-between"
                    >
                      <span className="flex items-center">
                        <User className="h-5 w-5 text-gray-400 mr-3" />
                        {selectedUser ? (
                          <span>{selectedUser.first_name} {selectedUser.last_name} ({selectedUser.email})</span>
                        ) : (
                          <span className="text-gray-500">
                            {loadingUsers ? 'Loading users...' : 'Select a client'}
                          </span>
                        )}
                      </span>
                      <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    {showDropdown && !loadingUsers && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {availableUsers.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No available clients found
                          </div>
                        ) : (
                          availableUsers.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleUserSelect(user)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {user.first_name} {user.last_name}
                                </p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                                {user.phone && (
                                  <p className="text-xs text-gray-500">{user.phone}</p>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {userError && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-[#2a5d90]">{userError}</p>
                  </div>
                )}

                {selectedUser && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-900">
                          {selectedUser.first_name} {selectedUser.last_name}
                        </p>
                        <p className="text-sm text-green-700">{selectedUser.email}</p>
                        {selectedUser.phone && (
                          <p className="text-sm text-green-600">{selectedUser.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedUser || loadingUsers}
                    className="flex-1 px-4 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[color:#1e4a73] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
