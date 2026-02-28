"use client"
import React, { useState, useEffect } from "react";
import { type ClassData, type ClientData, type AttendanceData, type EnrollmentData, type InstructorData } from "@/entities";
import { Input } from "@/components/ui/input";
import { Calendar, Search, Users, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AttendanceTracker from "@/components/attendance/attendanceTracker";
import BatchManagement from "@/components/attendance/BatchManagement";
import AttendanceReports from "@/components/attendance/attendanceReport";

export default function Attendance() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [instructors, setInstructors] = useState<InstructorData[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tracker");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [classesResponse, clientsResponse, instructorsResponse, enrollmentsResponse, attendanceResponse] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/clients'),
        fetch('/api/instructors'),
        fetch('/api/enrollments'),
        fetch('/api/attendance')
      ]);
      
      if (!classesResponse.ok || !clientsResponse.ok || !instructorsResponse.ok || !enrollmentsResponse.ok || !attendanceResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const [classesData, clientsData, instructorsData, enrollmentsData, attendanceData] = await Promise.all([
        classesResponse.json(),
        clientsResponse.json(),
        instructorsResponse.json(),
        enrollmentsResponse.json(),
        attendanceResponse.json()
      ]);
      
      setClasses(classesData);
      setClients(clientsData);
      setInstructors(instructorsData);
      setEnrollments(enrollmentsData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const handleAttendanceUpdate = async (classId: string, clientId: string, status: 'present' | 'absent' | 'late' | 'excused', notes = "") => {
    try {
      // Create or update attendance record
      const attendanceRecord = {
        class_id: classId,
        client_id: clientId,
        enrollment_id: enrollments.find(e => e.client_id === clientId && e.class_id === classId)?.id || '',
        date: selectedDate,
        status: status,
        check_in_time: status === 'present' ? new Date().toTimeString().split(' ')[0] : undefined,
        notes: notes
      };

      // Check if attendance already exists for this class and client
      const existingAttendance = attendance.find(
        att => att.class_id === classId && att.client_id === clientId && att.date === selectedDate
      );

      if (existingAttendance && existingAttendance.id) {
        // Update existing attendance record
        const response = await fetch(`/api/attendance/${existingAttendance.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(attendanceRecord),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update attendance');
        }
      } else {
        // Create new attendance record
        const response = await fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(attendanceRecord),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create attendance');
        }
      }

      // Update enrollment if present
      if (status === 'present') {
        const enrollment = enrollments.find(
          enr => enr.client_id === clientId && enr.class_id === classId && enr.status === 'active'
        );
        
        if (enrollment && enrollment.id) {
          // Update enrollment via API call
          const enrollmentResponse = await fetch(`/api/enrollments/${enrollment.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'active'
            }),
          });
          
          if (!enrollmentResponse.ok) {
            console.warn('Failed to update enrollment status');
          }
        }
      }

      loadData();
    } catch (error) {
      console.error('Error updating attendance:', error);
    }
  };

  const todaysClasses = classes.filter(cls => cls.date === selectedDate);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Attendance Tracking</h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">Track student attendance and manage lesson batches</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search students or classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200"
              />
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/80 backdrop-blur-sm border-slate-200"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="bg-white/80 backdrop-blur-sm border border-slate-200 min-w-max">
              <TabsTrigger value="tracker" className="flex items-center gap-2 whitespace-nowrap">
                <CheckCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Attendance Tracker</span>
                <span className="sm:hidden">Tracker</span>
              </TabsTrigger>
              <TabsTrigger value="batches" className="flex items-center gap-2 whitespace-nowrap">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Lesson Batches</span>
                <span className="sm:hidden">Batches</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2 whitespace-nowrap">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Reports</span>
                <span className="sm:hidden">Reports</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tracker">
            <AttendanceTracker
              classes={todaysClasses}
              clients={clients}
              instructors={instructors}
              enrollments={enrollments}
              attendance={attendance}
              selectedDate={selectedDate}
              isLoading={isLoading}
              onAttendanceUpdate={handleAttendanceUpdate}
              searchTerm={searchTerm}
            />
          </TabsContent>

          <TabsContent value="batches">
            <BatchManagement
              enrollments={enrollments}
              clients={clients}
              classes={classes}
              isLoading={isLoading}
              onDataUpdate={loadData}
            />
          </TabsContent>

          <TabsContent value="reports">
            <AttendanceReports
              attendance={attendance}
              enrollments={enrollments}
              clients={clients}
              classes={classes}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}