import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClientData } from "@/entities";

interface ClientStatsProps {
  clients: ClientData[];
  isLoading: boolean;
}

export default function ClientStats({ clients, isLoading }: ClientStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalClients = clients.length;
  const activeClients = clients.filter(client => client.status === 'enrolled' || client.status === 'approved' || client.status === undefined).length;
  const inactiveClients = clients.filter(client => client.status === 'pending' || client.status === 'declined').length;
  const expiringMemberships = 0; // Remove membership_expiry logic, not in unified schema

  const stats = [
    {
      title: "Total Clients",
      value: totalClients,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "All registered clients"
    },
    {
      title: "Active Clients",
      value: activeClients,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Currently active members"
    },
    {
      title: "Inactive Clients",
      value: inactiveClients,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "Inactive members"
    },
    {
      title: "Expiring Soon",
      value: expiringMemberships,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Memberships expiring in 30 days (legacy only)"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {stat.value}
              </div>
              <p className="text-xs text-slate-500">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
