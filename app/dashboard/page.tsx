"use client"
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
  BookOpen,
  CreditCard
} from "lucide-react";
import { format, isToday, isThisWeek, isThisMonth } from "date-fns";

import StatsOverview from "@/components/dashboard/StatsOverview";
import TodaysClasses from "@/components/dashboard/TodaysClasses";
import RecentActivity from "@/components/dashboard/RecentActivity";
import RevenueChart from "@/components/dashboard/RevenueChart";

interface Stats {
  totalClients: number;
  totalClasses: number;
  todaysClasses: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  attendanceRate: number;
}

interface Activity {
  type: string;
  title: string;
  time: string;
  status?: string;
  amount?: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalClasses: 0,
    todaysClasses: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    attendanceRate: 0
  });
  const [todaysClasses, setTodaysClasses] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    try {
      // First check user authentication and role
      const authResponse = await fetch('/api/auth', {
        credentials: 'include'
      });
      
      if (!authResponse.ok) {
        router.push('/login');
        return;
      }
      
      const authData = await authResponse.json();
      setUser(authData.user);
      
      // If user is a client, redirect to account page
      if (authData.user.role === 'client') {
        router.push('/account');
        return;
      }
      
      // Only load admin/trainer dashboard data for admin/trainer users
      if (authData.user.role === 'admin' || authData.user.role === 'trainer') {
        await loadDashboardData();
      }
    } catch (error) {
      console.error('Error checking user auth:', error);
      router.push('/login');
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dashboard', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      
      setStats({
        totalClients: data.stats.totalClients,
        totalClasses: data.stats.totalClasses,
        todaysClasses: data.stats.todaysClasses,
        weeklyRevenue: data.stats.weeklyRevenue,
        monthlyRevenue: data.stats.monthlyRevenue,
        attendanceRate: data.stats.attendanceRate
      });

      setTodaysClasses(data.todaysClasses || []);
      setRecentActivity(data.recentActivity || []);
      setRevenueData(data.revenueChartData || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default values on error
      setStats({
        totalClients: 0,
        totalClasses: 0,
        todaysClasses: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0,
        attendanceRate: 0
      });
      setTodaysClasses([]);
      setRecentActivity([]);
      setRevenueData([]);
    }
    setIsLoading(false);
  };

  // Show loading while checking user role
  if (isLoading && !user) {
    return (
      <div className="p-6 space-y-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-slate-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render admin dashboard for clients (they should be redirected)
  if (user && user.role === 'client') {
    router.push('/account');
    return null;
  }

  return (
    <div className="p-6 space-y-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">Welcome back! Here's what's happening at your studio today.</p>
          </div>
          <div className="flex gap-3">
            <Link href={"/dashboard/classes?action=new"}>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                New Class
              </Button>
            </Link>
            <Link href={"/dashboard/clients?action=new"}>
              <Button variant="outline" className="border-slate-300 hover:bg-slate-50">
                <Users className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <StatsOverview stats={stats} isLoading={isLoading} />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Today's Classes */}
          <div className="lg:col-span-2">
            <TodaysClasses classes={todaysClasses} isLoading={isLoading} onRefresh={loadDashboardData} />
          </div>

          {/* Right Column - Recent Activity */}
          <div>
            <RecentActivity activities={recentActivity} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}