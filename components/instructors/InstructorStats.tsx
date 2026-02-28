import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Clock, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { InstructorData } from "@/entities";

interface InstructorStatsProps {
  instructors: InstructorData[];
  isLoading: boolean;
}

export default function InstructorStats({ instructors, isLoading }: InstructorStatsProps) {
  const totalInstructors = instructors.length;
  const activeInstructors = instructors.filter(instructor => 
    instructor.hire_date && new Date(instructor.hire_date) <= new Date()
  ).length;

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="Total Trainers"
        value={totalInstructors}
        icon={Users}
        color="bg-blue-100 text-blue-600"
        isLoading={isLoading}
        subtitle="all trainers"
      />
      <StatCard
        title="Active Trainers"
        value={activeInstructors}
        icon={UserCheck}
        color="bg-green-100 text-green-600"
        isLoading={isLoading}
        subtitle="currently hired"
      />
      <StatCard
        title="This Year"
        value={new Date().getFullYear()}
        icon={Clock}
        color="bg-indigo-100 text-indigo-600"
        isLoading={isLoading}
        subtitle="current year"
      />
    </div>
  );
}
