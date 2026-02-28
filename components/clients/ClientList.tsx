import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar,
  Filter,
  User
} from "lucide-react";
import { format } from "date-fns";
import type { ClientData } from "@/entities";


function formatPhoneNumber(phone: string) {
  // Format for Singapore numbers: +65 XXXX XXXX
  const cleaned = ('' + phone).replace(/\D/g, '');
  // Singapore numbers are 8 digits, sometimes prefixed with country code
  if (cleaned.length === 8) {
    return `+65 ${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  if (cleaned.length === 10 && cleaned.startsWith('65')) {
    return `+65 ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('065')) {
    return `+65 ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.length == 12 && cleaned.startsWith('92')) {
    // Special case for numbers starting with 92 (e.g., +92 334 567 8901)
    return `+92 ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }
  // Fallback: return as is
  return phone;
}

interface StatusOption {
  value: string;
  label: string;
}
interface ClientListProps {
  clients: ClientData[];
  isLoading: boolean;
  onEdit: (client: ClientData) => void;
  onDelete: (clientId: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  statusOptions: StatusOption[];
}

export default function ClientList({ 
  clients, 
  isLoading, 
  onEdit, 
  onDelete, 
  statusFilter, 
  onStatusFilterChange,
  statusOptions
}: ClientListProps) {
  
  const handleDelete = (clientId: string, clientName: string) => {
    // if (window.confirm(`Are you sure you want to delete ${clientName}? This action cannot be undone.`)) {
      onDelete(clientId);
    // }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 w-full">
          <CardTitle className="text-xl font-bold text-slate-900 w-full">
            Clients ({clients.length})
          </CardTitle>
          {/* <div className="w-full sm:w-auto flex justify-start sm:justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto text-[#2a5d90] bg-transparent border-[#2a5d90] hover:bg-[#2a5d90]/10">
                  <Filter className="w-4 h-4 mr-2" />
                  Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                {statusOptions.map(option => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onStatusFilterChange(option.value)}
                    className={statusFilter === option.value ? 'font-bold bg-slate-100' : ''}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div> */}
        </div>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No clients found</h3>
            <p className="text-slate-500">
              {statusFilter === 'all' 
                ? "Get started by adding your first client." 
                : `No clients found with status "${statusFilter}".`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-y-2 sm:gap-y-0 sm:gap-x-4 p-3 sm:p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors w-full"
              >
                {/* Avatar */}
                <div className="flex-shrink-0 mb-2 sm:mb-0 w-full sm:w-auto flex justify-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {client.first_name?.charAt(0)}{client.last_name?.charAt(0)}
                  </div>
                </div>

                {/* Client Info */}
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-1 w-full">
                    <h3 className="text-sm sm:text-base font-medium text-slate-900 truncate break-words w-full">
                      {client.first_name} {client.last_name}
                    </h3>
                    {/* Status badge only */}
                    <div className="mt-1 sm:mt-0 w-full sm:w-auto">
                      <Badge className={getStatusColor(client.status || 'pending')}>
                        {client.status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-slate-500 gap-y-1 sm:gap-y-0 w-full">
                    {client.email && (
                      <div className="flex items-center space-x-1 w-full">
                        <Mail className="w-3 h-3" />
                        <span className="truncate break-words w-full">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center space-x-1 w-full">
                        <Phone className="w-3 h-3" />
                        <span className="truncate break-words w-full">{formatPhoneNumber(client.phone)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="self-end sm:self-center mt-2 sm:mt-0 w-full sm:w-auto flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(client)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(client.id!, `${client.first_name} ${client.last_name}`)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
