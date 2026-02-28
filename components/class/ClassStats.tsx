import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Clock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClassData } from "@/entities";

interface ClassStatsProps {
  classes: ClassData[];
  isLoading: boolean;
}

export default function ClassStats({ classes, isLoading }: ClassStatsProps) {
  const today = new Date();
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const totalClasses = classes.length;
  const scheduledClasses = classes.filter(cls => cls.status === 'scheduled').length;
  const completedClasses = classes.filter(cls => cls.status === 'completed').length;
  const todaysClasses = classes.filter(cls => {
    const classDate = new Date(cls.date);
    return classDate.toDateString() === today.toDateString();
  }).length;
  
  const totalCapacity = classes.reduce((sum, cls) => sum + (cls.max_capacity || 0), 0);
  const averageClassSize = totalClasses > 0 ? Math.round(totalCapacity / totalClasses) : 0;
  
  const weeklyClasses = classes.filter(cls => {
    const classDate = new Date(cls.date);
    return classDate >= thisWeek && classDate <= today;
  }).length;

  const StatCard = ({ title, value, icon: Icon, color, isLoading, subtitle }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color: string;
    isLoading: boolean;
    subtitle?: string;
  }) => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            {subtitle && <Skeleton className="h-4 w-24" />}
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Classes"
        value={totalClasses}
        icon={Calendar}
        color="bg-blue-100 text-blue-600"
        isLoading={isLoading}
        subtitle={`${scheduledClasses} scheduled`}
      />
      <StatCard
        title="Today's Classes"
        value={todaysClasses}
        icon={Clock}
        color="bg-green-100 text-green-600"
        isLoading={isLoading}
        subtitle="classes scheduled today"
      />
      <StatCard
        title="Completed Classes"
        value={completedClasses}
        icon={TrendingUp}
        color="bg-indigo-100 text-indigo-600"
        isLoading={isLoading}
        subtitle={`${weeklyClasses} this week`}
      />
      <StatCard
        title="Avg. Class Size"
        value={averageClassSize}
        icon={Users}
        color="bg-purple-100 text-purple-600"
        isLoading={isLoading}
        subtitle="students per class"
      />
    </div>
  );
}
