import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, TrendingUp, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: string | null;
  color?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color, isLoading }) => (
  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      <div className={`p-2 rounded-lg ${color}`}>
        {Icon && <Icon className="w-4 h-4" />}
      </div>
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold text-slate-900">{value ?? '-'}</div>
          {trend && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

const defaultStats = {
  totalClients: 0,
  todaysClasses: 0,
  monthlyRevenue: 0,
  attendanceRate: 0,
};

export default function StatsOverview({ stats = defaultStats, isLoading = false }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Clients"
        value={stats.totalClients}
        icon={Users}
        trend={typeof stats.totalClients === 'number' ? "+12% from last month" : null}
        color="bg-blue-100 text-blue-600"
        isLoading={isLoading}
      />
      <StatCard
        title="Today's Classes"
        value={stats.todaysClasses}
        icon={Calendar}
        trend={typeof stats.todaysClasses === 'number' ? "8 scheduled" : null}
        color="bg-green-100 text-green-600"
        isLoading={isLoading}
      />
      <StatCard
        title="Monthly Revenue"
        value={`$${typeof stats.monthlyRevenue === 'number' ? stats.monthlyRevenue.toFixed(0) : '-'}`}
        icon={DollarSign}
        trend={typeof stats.monthlyRevenue === 'number' ? "+18% from last month" : null}
        color="bg-indigo-100 text-indigo-600"
        isLoading={isLoading}
      />
      <StatCard
        title="Attendance Rate"
        value={typeof stats.attendanceRate === 'number' ? `${stats.attendanceRate.toFixed(1)}%` : '-'}
        icon={CheckCircle}
        trend={typeof stats.attendanceRate === 'number' ? "Above average" : null}
        color="bg-emerald-100 text-emerald-600"
        isLoading={isLoading}
      />
    </div>
  );
}