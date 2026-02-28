"use client"
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { type ClientData } from "@/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

import ClientList from "@/components/clients/ClientList";
import ClientForm from "@/components/clients/ClientForm";
import ClientStats from "@/components/clients/ClientStats";

function ClientsContent() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'enrolled', label: 'Enrolled' },
    { value: 'declined', label: 'Declined' },
  ];
  const searchParams = useSearchParams();

  useEffect(() => {
    loadClients();
    // Check URL parameters for new client action
    if (searchParams.get('action') === 'new') {
      setShowForm(true);
    }
  }, [searchParams]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const clientsData = await response.json();
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (clientData: any) => {
    try {
      if (editingClient) {
        // Update existing client
        const response = await fetch(`/api/clients/${editingClient.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
      } else {
        // Create new client
        const response = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
      }
      setShowForm(false);
      setEditingClient(null);
      loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
      alert(`Failed to save client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (client: ClientData) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/clients/${clientId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        loadClients();
      } catch (error) {
        console.error('Error deleting client:', error);
        alert(`Failed to delete client: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || (client.status && client.status.toLowerCase() === statusFilter);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
            <p className="text-slate-600 mt-1">Manage your studio members and their information</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200"
              />
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Client Form Modal */}
        {showForm && (
          <ClientForm
            client={editingClient}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingClient(null);
            }}
          />
        )}

        {/* Client Stats */}
        <ClientStats clients={clients} isLoading={isLoading} />

        {/* Client List */}
        <ClientList 
          clients={filteredClients}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statusOptions={statusOptions}
        />
      </div>
    </div>
  );
}

export default function Clients() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
              <p className="text-slate-600 mt-1">Manage your studio members and their information</p>
            </div>
          </div>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <ClientsContent />
    </Suspense>
  );
}