"use client"
import React, { useState, useEffect } from "react";
import { Client, type ClientData } from "@/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Edit, Users, Calendar, DollarSign, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/components/auth/RoleGuard";
import { AdminOnlyGuard } from "@/components/auth/AdminOnlyGuard";

interface SubscriptionData {
  id: string;
  client_id: string;
  client?: ClientData;
  plan_name: string;
  status: 'active' | 'inactive' | 'suspended' | 'cancelled';
  start_date: string;
  end_date?: string;
  next_billing_date?: string;
  amount: number;
  billing_frequency: 'monthly' | 'weekly' | 'annual';
  sessions_remaining?: number;
  sessions_total?: number;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export default function SubscriptionManagement() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionData | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const { user, isAdmin, isStaff } = usePermissions();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clientsResponse, subscriptionsResponse] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/subscriptions')
      ]);
      
      if (!clientsResponse.ok || !subscriptionsResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const [clientsData, subscriptionsData] = await Promise.all([
        clientsResponse.json(),
        subscriptionsResponse.json()
      ]);
      
      setClients(clientsData);
      setSubscriptions(subscriptionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Create mock data for demo purposes
      const mockSubscriptions: SubscriptionData[] = clients.map((client, index) => ({
        id: `sub_${index + 1}`,
        client_id: client.id,
        client: client,
        plan_name: ['Monthly Swimming', 'Weekly Training', 'Annual Membership'][index % 3],
        status: ['active', 'inactive', 'suspended'][index % 3] as any,
        start_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        next_billing_date: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: [100, 150, 1000][index % 3],
        billing_frequency: ['monthly', 'weekly', 'annual'][index % 3] as any,
        sessions_remaining: Math.floor(Math.random() * 20),
        sessions_total: 20,
        created_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        notes: `Notes for ${client.first_name} ${client.last_name}`
      }));
      setSubscriptions(mockSubscriptions);
    }
    setIsLoading(false);
  };

  const handleUpdateSubscription = async (subscription: SubscriptionData) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      const updatedSubscription = await response.json();
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === subscription.id ? updatedSubscription : sub
        )
      );
      
      setShowEditForm(false);
      setEditingSubscription(null);
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Failed to update subscription');
    }
  };

  const handleStatusChange = async (subscriptionId: string, newStatus: SubscriptionData['status']) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription status');
      }

      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === subscriptionId ? { ...sub, status: newStatus } : sub
        )
      );
    } catch (error) {
      console.error('Error updating subscription status:', error);
      alert('Failed to update subscription status');
    }
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = subscription.client?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.client?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.plan_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || subscription.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✅';
      case 'inactive': return '⚪';
      case 'suspended': return '⚠️';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  const totalSubscriptions = subscriptions.length;
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
  const totalRevenue = subscriptions.filter(sub => sub.status === 'active').reduce((sum, sub) => sum + sub.amount, 0);
  const avgSessionsRemaining = subscriptions.reduce((sum, sub) => sum + (sub.sessions_remaining || 0), 0) / subscriptions.length;

  if (isLoading) {
    return (
      <AdminOnlyGuard>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </AdminOnlyGuard>
    );
  }

  return (
    <AdminOnlyGuard>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Client Subscriptions</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Subscriptions</p>
                <p className="text-2xl font-bold">{totalSubscriptions}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-green-600">{activeSubscriptions}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Sessions Left</p>
                <p className="text-2xl font-bold">{avgSessionsRemaining.toFixed(1)}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search clients or plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {filteredSubscriptions.map((subscription) => (
          <Card key={subscription.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">
                      {subscription.client?.first_name} {subscription.client?.last_name}
                    </h3>
                    <Badge className={getStatusColor(subscription.status)}>
                      {getStatusIcon(subscription.status)} {subscription.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{subscription.plan_name}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Amount:</span><br />
                      ${subscription.amount.toFixed(2)} / {subscription.billing_frequency}
                    </div>
                    <div>
                      <span className="font-medium">Sessions:</span><br />
                      {subscription.sessions_remaining || 0} / {subscription.sessions_total || 0} remaining
                    </div>
                    <div>
                      <span className="font-medium">Started:</span><br />
                      {new Date(subscription.start_date).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Next Billing:</span><br />
                      {subscription.next_billing_date 
                        ? new Date(subscription.next_billing_date).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                  {subscription.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                      <strong>Notes:</strong> {subscription.notes}
                    </div>
                  )}
                </div>
                {isStaff() && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingSubscription(subscription);
                        setShowEditForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Select
                      value={subscription.status}
                      onValueChange={(value) => handleStatusChange(subscription.id, value as any)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSubscriptions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No subscriptions found matching your criteria.
        </div>
      )}

      {/* Edit Subscription Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
          </DialogHeader>
          {editingSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plan_name">Plan Name</Label>
                  <Input
                    id="plan_name"
                    value={editingSubscription.plan_name}
                    onChange={(e) => setEditingSubscription(prev => 
                      prev ? { ...prev, plan_name: e.target.value } : null
                    )}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={editingSubscription.amount}
                    onChange={(e) => setEditingSubscription(prev => 
                      prev ? { ...prev, amount: parseFloat(e.target.value) } : null
                    )}
                  />
                </div>
                <div>
                  <Label htmlFor="billing_frequency">Billing Frequency</Label>
                  <Select 
                    value={editingSubscription.billing_frequency}
                    onValueChange={(value) => setEditingSubscription(prev => 
                      prev ? { ...prev, billing_frequency: value as any } : null
                    )}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sessions_total">Total Sessions</Label>
                  <Input
                    id="sessions_total"
                    type="number"
                    value={editingSubscription.sessions_total || ''}
                    onChange={(e) => setEditingSubscription(prev => 
                      prev ? { ...prev, sessions_total: parseInt(e.target.value) } : null
                    )}
                  />
                </div>
                <div>
                  <Label htmlFor="sessions_remaining">Sessions Remaining</Label>
                  <Input
                    id="sessions_remaining"
                    type="number"
                    value={editingSubscription.sessions_remaining || ''}
                    onChange={(e) => setEditingSubscription(prev => 
                      prev ? { ...prev, sessions_remaining: parseInt(e.target.value) } : null
                    )}
                  />
                </div>
                <div>
                  <Label htmlFor="next_billing_date">Next Billing Date</Label>
                  <Input
                    id="next_billing_date"
                    type="date"
                    value={editingSubscription.next_billing_date?.split('T')[0] || ''}
                    onChange={(e) => setEditingSubscription(prev => 
                      prev ? { ...prev, next_billing_date: e.target.value } : null
                    )}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editingSubscription.notes || ''}
                  onChange={(e) => setEditingSubscription(prev => 
                    prev ? { ...prev, notes: e.target.value } : null
                  )}
                  placeholder="Add notes about this subscription..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditForm(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleUpdateSubscription(editingSubscription)}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AdminOnlyGuard>
  );
}
