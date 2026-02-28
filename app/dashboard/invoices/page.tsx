"use client"
import React, { useState, useEffect } from "react";
import { Invoice, Client, type InvoiceData, type ClientData } from "@/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, Search, Send, Edit, Eye, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/components/auth/RoleGuard";
import { AdminOnlyGuard } from "@/components/auth/AdminOnlyGuard";

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null);
  const { user, isAdmin, isStaff } = usePermissions();

  const [newInvoice, setNewInvoice] = useState({
    client_id: "",
    amount: "",
    description: "",
    due_date: "",
    status: "draft" as const
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clientsResponse, invoicesResponse] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/invoices')
      ]);
      
      if (!clientsResponse.ok || !invoicesResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const [clientsData, invoicesData] = await Promise.all([
        clientsResponse.json(),
        invoicesResponse.json()
      ]);
      
      setClients(clientsData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const handleCreateInvoice = async () => {
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newInvoice,
          amount: parseFloat(newInvoice.amount),
          due_date: new Date(newInvoice.due_date).toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }

      const createdInvoice = await response.json();
      setInvoices(prev => [...prev, createdInvoice]);
      setShowCreateForm(false);
      setNewInvoice({
        client_id: "",
        amount: "",
        description: "",
        due_date: "",
        status: "draft"
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to send invoice');
      }

      // Refresh invoices to get updated status from Stripe
      await loadData();
      
      alert('Invoice sent successfully!');
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Failed to send invoice');
    }
  };

  const handleRefreshInvoiceStatus = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/refresh-status`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to refresh invoice status');
      }

      // Refresh invoices to get updated status
      await loadData();
      
      alert('Invoice status refreshed from Stripe!');
    } catch (error) {
      console.error('Error refreshing invoice status:', error);
      alert('Failed to refresh invoice status');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'sent': return 'Sent (Awaiting Payment)';
      case 'paid': return 'Paid ✓';
      case 'overdue': return 'Overdue';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const totalInvoices = invoices.length;
  const totalAmount = invoices.filter(inv => inv.status !== 'cancelled').reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'draft' || inv.status === 'sent').reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
  const cancelledAmount = invoices.filter(inv => inv.status === 'cancelled').reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <AdminOnlyGuard>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Invoice Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Invoice statuses are automatically synced with Stripe. Payment status updates in real-time via webhooks.
          </p>
        </div>
        {isStaff() && (
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="client">Client</Label>
                  <Select value={newInvoice.client_id} onValueChange={(value) => setNewInvoice(prev => ({ ...prev, client_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newInvoice.description}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Invoice description"
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newInvoice.due_date}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                <Button onClick={handleCreateInvoice} className="w-full">
                  Create Invoice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold">{totalInvoices}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Excludes cancelled</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">${paidAmount.toFixed(2)}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">${pendingAmount.toFixed(2)}</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled Amount</p>
                <p className="text-2xl font-bold text-red-600">${cancelledAmount.toFixed(2)}</p>
              </div>
              <FileText className="h-8 w-8 text-red-600" />
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
              placeholder="Search invoices..."
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.map((invoice) => (
          <Card key={invoice.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">
                      {invoice.client?.first_name} {invoice.client?.last_name}
                    </h3>
                    <Badge className={getStatusColor(invoice.status || 'pending')}>
                      {getStatusText(invoice.status || 'pending')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{invoice.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className={invoice.status === 'cancelled' ? 'line-through text-red-500' : ''}>
                      Amount: ${invoice.amount?.toFixed(2) || '0.00'}
                      {invoice.status === 'cancelled' && <span className="ml-1 text-red-600">(Cancelled)</span>}
                    </span>
                    {invoice.due_date && (
                      <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                    )}
                    <span>Created: {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : 'N/A'}</span>
                    {invoice.stripe_invoice_id && (
                      <span className="text-purple-600 font-medium">
                        Stripe: {invoice.stripe_invoice_id.slice(-8)}
                      </span>
                    )}
                  </div>
                  {invoice.status === 'paid' && invoice.paid_date && (
                    <div className="text-xs text-green-600 mt-1">
                      Paid: {new Date(invoice.paid_date).toLocaleDateString()}
                    </div>
                  )}
                  {!invoice.stripe_invoice_id && invoice.status !== 'draft' && (
                    <div className="text-xs text-yellow-600 mt-1">
                      ⚠️ Legacy invoice - not integrated with Stripe
                    </div>
                  )}
                </div>
                {isStaff() && (
                  <div className="flex gap-2">
                    {invoice.status === 'draft' && (
                      <Button
                        size="sm"
                        onClick={() => invoice.id && handleSendInvoice(invoice.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Send via Stripe
                      </Button>
                    )}
                    {(invoice.status === 'sent' || invoice.status === 'paid') && invoice.stripe_invoice_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => invoice.id && handleRefreshInvoiceStatus(invoice.id)}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Refresh Status
                      </Button>
                    )}
                    {invoice.stripe_invoice_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`https://dashboard.stripe.com/invoices/${invoice.stripe_invoice_id}`, '_blank')}
                        className="text-purple-600 hover:bg-purple-50"
                      >
                        View in Stripe
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No invoices found matching your criteria.
        </div>
      )}

      {/* Stripe Integration Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Stripe Integration</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• Invoice payments are processed through Stripe automatically</p>
          <p>• Status updates (paid, failed, etc.) are synced in real-time via webhooks</p>
          <p>• Use "Refresh Status" to manually sync with Stripe if needed</p>
          <p>• "View in Stripe" opens the invoice in your Stripe dashboard</p>
        </div>
      </div>
      </div>
    </AdminOnlyGuard>
  );
}
