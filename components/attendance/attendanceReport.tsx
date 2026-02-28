import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Calendar, Users, TrendingUp, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns";
import type { AttendanceData, EnrollmentData, ClientData, ClassData } from "@/entities";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface AttendanceReportsProps {
  attendance: AttendanceData[];
  enrollments: EnrollmentData[];
  clients: ClientData[];
  classes: ClassData[];
  isLoading: boolean;
}

export default function AttendanceReports({
  attendance,
  enrollments,
  clients,
  classes,
  isLoading
}: AttendanceReportsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [selectedClass, setSelectedClass] = useState('all');

  const filteredData = useMemo(() => {
    let filteredAttendance = attendance;
    
    // Filter by period
    const now = new Date();
    const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
    
    if (selectedPeriod === 'this_month') {
      filteredAttendance = attendance.filter(att => {
        const attDate = new Date(att.date);
        return (
          (isAfter(attDate, thisMonth.start) || attDate.getTime() === thisMonth.start.getTime()) &&
          (isBefore(attDate, thisMonth.end) || attDate.getTime() === thisMonth.end.getTime())
        );
      });
    }

    // Filter by class
    if (selectedClass !== 'all') {
      filteredAttendance = filteredAttendance.filter(att => att.class_id === selectedClass);
    }

    return filteredAttendance;
  }, [attendance, selectedPeriod, selectedClass]);

  const attendanceStats = useMemo(() => {
    const totalSessions = filteredData.length;
    const presentCount = filteredData.filter(att => att.status === 'present').length;
    const absentCount = filteredData.filter(att => att.status === 'absent').length;
    const lateCount = filteredData.filter(att => att.status === 'late').length;
    const excusedCount = filteredData.filter(att => att.status === 'excused').length;
    
    return {
      totalSessions,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate: totalSessions > 0 ? (presentCount / totalSessions * 100).toFixed(1) : 0
    };
  }, [filteredData]);

  const classAttendanceData = useMemo(() => {
    const classStats: Record<string, any> = {};
    
    filteredData.forEach(att => {
      const classData = classes.find(c => c.id === att.class_id);
      const className = classData?.name || 'Unknown Class';
      
      if (!classStats[className]) {
        classStats[className] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      }
      classStats[className][att.status || 'absent']++;
      classStats[className].total++;
    });

    return Object.entries(classStats).map(([className, stats]) => ({
      name: className,
      present: stats.present,
      absent: stats.absent,
      late: stats.late,
      excused: stats.excused,
      rate: stats.total > 0 ? (stats.present / stats.total * 100).toFixed(1) : 0
    }));
  }, [filteredData, classes]);

  const statusDistribution = useMemo(() => [
    { name: 'Present', value: attendanceStats.presentCount, color: COLORS[1] },
    { name: 'Absent', value: attendanceStats.absentCount, color: COLORS[3] },
    { name: 'Late', value: attendanceStats.lateCount, color: COLORS[2] },
    { name: 'Excused', value: attendanceStats.excusedCount, color: COLORS[4] }
  ].filter(item => item.value > 0), [attendanceStats]);

  const topStudents = useMemo(() => {
    const studentStats: Record<string, any> = {};
    
    filteredData.forEach(att => {
      const client = clients.find(c => c.id === att.client_id);
      const clientName = client ? `${client.first_name} ${client.last_name}` : 'Unknown Client';
      
      if (!studentStats[clientName]) {
        studentStats[clientName] = { present: 0, total: 0 };
      }
      if (att.status === 'present') studentStats[clientName].present++;
      studentStats[clientName].total++;
    });

    return Object.entries(studentStats)
      .map(([name, stats]) => ({
        name,
        attendance: stats.present,
        rate: stats.total > 0 ? (stats.present / stats.total * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.attendance - a.attendance)
      .slice(0, 5);
  }, [filteredData, clients]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-xl font-bold text-slate-900">Attendance Reports</CardTitle>
            <div className="flex gap-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">This Month</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Sessions</p>
                <p className="text-2xl font-bold text-slate-900">{attendanceStats.totalSessions}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Present</p>
                <p className="text-2xl font-bold text-green-600">{attendanceStats.presentCount}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-blue-600">{attendanceStats.attendanceRate}%</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Absent</p>
                <p className="text-2xl font-bold text-red-600">{attendanceStats.absentCount}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Attendance Chart */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Attendance by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classAttendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar dataKey="present" fill="#10b981" name="Present" />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" />
                  <Bar dataKey="late" fill="#f59e0b" name="Late" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Attendance Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Students */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Top Attending Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topStudents.map((student, index) => (
              <div key={student.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-slate-100 text-slate-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-slate-900">{student.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">{student.attendance} sessions</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {student.rate}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}