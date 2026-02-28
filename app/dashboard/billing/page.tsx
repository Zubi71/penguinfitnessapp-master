"use client"
import React, { useState, useEffect } from "react";
import { Invoice, Client, type InvoiceData, type ClientData } from "@/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CreditCard, FileText, Plus, Search, Download, Trash2, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminOnlyGuard } from "@/components/auth/AdminOnlyGuard";

export default function Billing() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("invoices");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load all data via API routes
      const [clientsResponse, invoicesResponse] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/invoices')
      ]);
      
      if (!clientsResponse.ok) {
        throw new Error('Failed to fetch clients');
      }
      if (!invoicesResponse.ok) {
        const errorText = await invoicesResponse.text();
        console.error('Invoice API error:', errorText);
        throw new Error(`Failed to fetch invoices: ${invoicesResponse.status}`);
      }
      
      const [clientsData, invoicesData] = await Promise.all([
        clientsResponse.json(),
        invoicesResponse.json()
      ]);
      
      console.log('Loaded invoices:', invoicesData);
      console.log('Loaded clients:', clientsData);
      
      setClients(clientsData);
      setInvoices(invoicesData);
      
    } catch (error) {
      console.error('Error loading billing data:', error);
    }
    setIsLoading(false);
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices?id=${invoiceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete invoice error:', errorText);
        alert('Failed to delete invoice. Please try again.');
        return;
      }

      // Remove invoice from local state
      setInvoices(invoices.filter(invoice => invoice.id !== invoiceId));
      alert('Invoice deleted successfully.');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    }
  };

  const cancelInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to cancel this invoice?')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices?id=${invoiceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'cancelled'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cancel invoice error:', errorText);
        alert('Failed to cancel invoice. Please try again.');
        return;
      }

      const updatedInvoice = await response.json();
      
      // Update invoice in local state
      setInvoices(invoices.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, status: 'cancelled' } 
          : invoice
      ));
      
      alert('Invoice cancelled successfully.');
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      alert('Failed to cancel invoice. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const client = clients.find(c => c.id === invoice.client_id);
    const clientName = client ? `${client.first_name} ${client.last_name}` : '';
    return clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const calculateStats = () => {
    // Calculate stats from invoices only
    const totalRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.total_amount || 0), 0);
    
    const pendingPayments = invoices
      .filter(i => i.status === 'draft' || i.status === 'sent')
      .reduce((sum, i) => sum + (i.total_amount || 0), 0);
    
    const overdueInvoices = invoices
      .filter(i => i.status === 'overdue')
      .reduce((sum, i) => sum + (i.total_amount || 0), 0);

    const cancelledInvoices = invoices
      .filter(i => i.status === 'cancelled')
      .reduce((sum, i) => sum + (i.total_amount || 0), 0);

    return { totalRevenue, pendingPayments, overdueInvoices, cancelledInvoices };
  };

  const { totalRevenue, pendingPayments, overdueInvoices, cancelledInvoices } = calculateStats();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6  min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-6 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <AdminOnlyGuard>
      <div className="p-6 space-y-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">          <div>
            <h1 className="text-3xl font-bold text-slate-900">Billing & Invoices</h1>
            <p className="text-slate-600 mt-1">
              Manage invoices and financial records 
              {invoices.length > 0 && <span className="ml-2 text-blue-600">({invoices.length} invoices loaded)</span>}
          </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200"
              />
            </div>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
            <Button 
              variant="outline" 
              onClick={loadData}
              disabled={isLoading}
              className="bg-white/80 backdrop-blur-sm border-slate-200"
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">${totalRevenue.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-slate-900">${pendingPayments.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <CreditCard className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Overdue Invoices</p>
                  <p className="text-2xl font-bold text-slate-900">${overdueInvoices.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Cancelled Invoices</p>
                  <p className="text-2xl font-bold text-slate-900">${cancelledInvoices.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <X className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-slate-200">
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Invoices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredInvoices.map((invoice) => {
                    const client = clients.find(c => c.id === invoice.client_id);
                    return (
                      <div key={invoice.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-purple-100 rounded-full">
                            <FileText className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">{client ? `${client.first_name} ${client.last_name}` : 'Unknown Client'}</p>
                            <p className="text-sm text-slate-600">#{invoice.invoice_number} • {new Date(invoice.created_at || '').toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">${invoice.total_amount?.toFixed(2)}</span>
                          <Badge className={getStatusColor(invoice.status || 'draft')}>
                            {invoice.status}
                          </Badge>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" title="Download Invoice">
                              <Download className="w-4 h-4" />
                            </Button>
                            
                            {/* Show Cancel button for sent/draft invoices */}
                            {(invoice.status === 'sent' || invoice.status === 'draft') && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => cancelInvoice(invoice.id!)}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                title="Cancel Invoice"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                            
                            {/* Show Delete button for cancelled/draft invoices */}
                            {(invoice.status === 'cancelled' || invoice.status === 'draft') && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => deleteInvoice(invoice.id!)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredInvoices.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p>No invoices found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </AdminOnlyGuard>
  );
}
