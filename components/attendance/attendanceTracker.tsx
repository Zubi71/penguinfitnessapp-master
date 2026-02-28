import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Calendar,
  AlertCircle 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClassData, ClientData, AttendanceData, EnrollmentData, InstructorData } from "@/entities";
import { format } from "date-fns";

// Utility function to format time to 12-hour format with AM/PM and no seconds
const formatTime = (timeString: string): string => {
  try {
    // Parse the time string (e.g., "14:30:00" or "14:30")
    const [hours, minutes] = timeString.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      return timeString; // Return original if parsing fails
    }
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${period}`;
  } catch (error) {
    return timeString; // Return original if any error occurs
  }
};

const AttendanceStatus = {
  present: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  absent: { icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
  late: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100" },
  excused: { icon: AlertCircle, color: "text-slate-600", bg: "bg-slate-100" }
};

interface StudentAttendanceCardProps {
  student: ClientData;
  classData: ClassData;
  enrollment: EnrollmentData;
  attendance?: AttendanceData;
  onAttendanceUpdate: (classId: string, clientId: string, status: 'present' | 'absent' | 'late' | 'excused', notes?: string) => Promise<void>;
}

const StudentAttendanceCard = ({ 
  student, 
  classData, 
  enrollment, 
  attendance, 
  onAttendanceUpdate 
}: StudentAttendanceCardProps) => {
  const [status, setStatus] = useState<'present' | 'absent' | 'late' | 'excused'>(attendance?.status || 'absent');
  const [notes, setNotes] = useState(attendance?.notes || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: 'present' | 'absent' | 'late' | 'excused') => {
    setIsUpdating(true);
    setStatus(newStatus);
    await onAttendanceUpdate(classData.id!, student.id!, newStatus, notes);
    setIsUpdating(false);
  };

  const StatusIcon = AttendanceStatus[status].icon;

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                {student.first_name?.[0]}{student.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-slate-900">
                {student.first_name} {student.last_name}
              </h3>
              <p className="text-sm text-slate-500">{student.email}</p>
            </div>
          </div>
          <div className={`p-2 rounded-full ${AttendanceStatus[status].bg}`}>
            <StatusIcon className={`w-4 h-4 ${AttendanceStatus[status].color}`} />
          </div>
        </div>

        {enrollment && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Enrollment Status:</span>
              <Badge variant="outline" className="font-semibold">
                {enrollment.status}
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Select value={status} onValueChange={handleStatusChange} disabled={isUpdating}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="present">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Present
                </div>
              </SelectItem>
              <SelectItem value="absent">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Absent
                </div>
              </SelectItem>
              <SelectItem value="late">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  Late
                </div>
              </SelectItem>
              <SelectItem value="excused">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-600" />
                  Excused
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Textarea
            placeholder="Add notes (optional)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="h-20 text-sm"
            onBlur={() => {
              if (notes !== attendance?.notes && classData.id && student.id) {
                onAttendanceUpdate(classData.id, student.id, status, notes);
              }
            }}
          />

          {attendance?.check_in_time && (
            <div className="text-xs text-slate-500">
              Check-in: {attendance.check_in_time}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface AttendanceTrackerProps {
  classes: ClassData[];
  clients: ClientData[];
  instructors: InstructorData[];
  enrollments: EnrollmentData[];
  attendance: AttendanceData[];
  selectedDate: string;
  isLoading: boolean;
  onAttendanceUpdate: (classId: string, clientId: string, status: 'present' | 'absent' | 'late' | 'excused', notes?: string) => Promise<void>;
  searchTerm: string;
}

export default function AttendanceTracker({
  classes,
  clients,
  instructors,
  enrollments,
  attendance,
  selectedDate,
  isLoading,
  onAttendanceUpdate,
  searchTerm
}: AttendanceTrackerProps) {
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);

  // Helper function to get instructor name by ID
  const getInstructorName = (instructorId: string | undefined) => {
    if (!instructorId) return 'No instructor assigned';
    const instructor = instructors.find(inst => inst.id === instructorId);
    return instructor ? `${instructor.first_name} ${instructor.last_name}` : 'Unknown instructor';
  };

  const filteredClients = clients.filter(client =>
    client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEnrolledStudents = (classId: string) => {
    const classEnrollments = enrollments.filter(
      enr => enr.class_id === classId && enr.status === 'active'
    );
    
    return classEnrollments.map(enrollment => {
      const student = clients.find(client => client.id === enrollment.client_id);
      const studentAttendance = attendance.find(
        att => att.class_id === classId && 
               att.client_id === enrollment.client_id && 
               att.date === selectedDate
      );
      
      return {
        student,
        enrollment,
        attendance: studentAttendance
      };
    }).filter(item => item.student && filteredClients.includes(item.student));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full mb-3" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Class Selection */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Select Class for Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No classes scheduled for this date</p>
              </div>
            ) : (
              classes.map((classData) => (
                <Card 
                  key={classData.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedClass?.id === classData.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedClass(classData)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-900">{classData.name}</h3>
                      <Badge variant="outline">
                        {formatTime(classData.start_time)}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">
                      Instructor: {getInstructorName(classData.instructor_id)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Users className="w-4 h-4" />
                      <span>
                        {classData.id ? getEnrolledStudents(classData.id).length : 0} enrolled
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Tracking */}
      {selectedClass && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Mark Attendance - {selectedClass.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedClass.id && getEnrolledStudents(selectedClass.id).map(({ student, enrollment, attendance }) => (
                student && (
                  <StudentAttendanceCard
                    key={student.id}
                    student={student}
                    classData={selectedClass}
                    enrollment={enrollment}
                    attendance={attendance}
                    onAttendanceUpdate={onAttendanceUpdate}
                  />
                )
              ))}
            </div>
            
            {selectedClass.id && getEnrolledStudents(selectedClass.id).length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No students enrolled in this class</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}