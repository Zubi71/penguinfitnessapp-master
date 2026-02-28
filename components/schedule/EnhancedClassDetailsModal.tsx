"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  DollarSign, 
  UserPlus, 
  CheckCircle, 
  XCircle,
  Edit,
  Trash2,
  Phone,
  Mail,
  Search,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

interface Enrollment {
  id: string;
  client_id: string;
  client?: Client;
}

interface AttendanceRecord {
  client_id: string;
  status: string;
}

interface AttendanceMap {
  [key: string]: string;
}

interface EnhancedClassDetailsModalProps {
  classData: any;
  onClose: () => void;
  onEdit: (e?: React.MouseEvent) => void;
  onDelete: (e?: React.MouseEvent) => Promise<void>;
}

const EnhancedClassDetailsModal: React.FC<EnhancedClassDetailsModalProps> = ({
  classData,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [enrolledStudents, setEnrolledStudents] = useState<Enrollment[]>([]);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    fetchEnrolledStudents();
    fetchAvailableClients();
    fetchAttendanceData();
  }, [classData.id]);

  const fetchEnrolledStudents = async () => {
    try {
      const response = await fetch(`/api/classes/${classData.id}/enrollments`);
      if (response.ok) {
        const data = await response.json();
        setEnrolledStudents(data || []);
      }
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
    }
  };

  const fetchAvailableClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setAvailableClients(data || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const response = await fetch(`/api/classes/${classData.id}/attendance`);
      if (response.ok) {
        const data: AttendanceRecord[] = await response.json();
        const attendanceMap: AttendanceMap = {};
        data.forEach((record: AttendanceRecord) => {
          attendanceMap[record.client_id] = record.status;
        });
        setAttendance(attendanceMap);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleEnrollStudent = async (clientId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/classes/${classData.id}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      });
      
      if (response.ok) {
        await fetchEnrolledStudents();
      } else {
        alert('Failed to enroll student');
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      alert('Error enrolling student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnenrollStudent = async (enrollmentId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchEnrolledStudents();
      } else {
        alert('Failed to unenroll student');
      }
    } catch (error) {
      console.error('Error unenrolling student:', error);
      alert('Error unenrolling student');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttendanceToggle = async (clientId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/classes/${classData.id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          client_id: clientId, 
          status: newStatus 
        }),
      });
      
      if (response.ok) {
        setAttendance(prev => ({
          ...prev,
          [clientId]: newStatus
        }));
      } else {
        alert('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Error updating attendance');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredClients = availableClients.filter(client =>
    !enrolledStudents.some(enrolled => enrolled.client_id === client.id) &&
    (client.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     client.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     client.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{classData.name}</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(classData.date)}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(classData.start_time)} - {formatTime(classData.end_time)}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {classData.location || 'Main Pool'}
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={cn("text-sm", getStatusColor(classData.status || 'scheduled'))}
          >
            {(classData.status || 'scheduled').replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={onDelete} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Class Details</TabsTrigger>
          <TabsTrigger value="students">
            Students ({enrolledStudents.length}/{classData.max_capacity})
          </TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="add-student">Add Student</TabsTrigger>
        </TabsList>

        {/* Class Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Class Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Type</Label>
                  <p className="text-sm capitalize">{classData.class_type || 'Group'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Level</Label>
                  <p className="text-sm capitalize">{classData.level || 'Beginner'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Duration</Label>
                  <p className="text-sm">{classData.duration_minutes || 45} minutes</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Capacity</Label>
                  <p className="text-sm">{enrolledStudents.length} / {classData.max_capacity} students</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing & Instructor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Price</Label>
                  <p className="text-sm font-semibold">${classData.price}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Instructor</Label>
                  <p className="text-sm">{classData.instructor_name || 'No instructor assigned'}</p>
                </div>
                {classData.description && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Description</Label>
                    <p className="text-sm text-gray-700">{classData.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
            </CardHeader>
            <CardContent>
              {enrolledStudents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No students enrolled yet</p>
              ) : (
                <div className="space-y-3">
                  {enrolledStudents.map((enrollment) => (
                    <motion.div
                      key={enrollment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {enrollment.client?.first_name?.[0]}{enrollment.client?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {enrollment.client?.first_name} {enrollment.client?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{enrollment.client?.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnenrollStudent(enrollment.id)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mark Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {enrolledStudents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No students enrolled to mark attendance</p>
              ) : (
                <div className="space-y-3">
                  {enrolledStudents.map((enrollment) => (
                    <motion.div
                      key={enrollment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {enrollment.client?.first_name?.[0]}{enrollment.client?.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {enrollment.client?.first_name} {enrollment.client?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{enrollment.client?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline"
                          className={cn(
                            attendance[enrollment.client_id] === 'present' 
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          )}
                        >
                          {attendance[enrollment.client_id] || 'Not marked'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAttendanceToggle(
                            enrollment.client_id, 
                            attendance[enrollment.client_id] || 'absent'
                          )}
                          disabled={isLoading}
                          className={cn(
                            attendance[enrollment.client_id] === 'present'
                              ? 'text-red-600 hover:text-red-700'
                              : 'text-green-600 hover:text-green-700'
                          )}
                        >
                          {attendance[enrollment.client_id] === 'present' ? (
                            <><XCircle className="w-4 h-4 mr-1" />Mark Absent</>
                          ) : (
                            <><CheckCircle className="w-4 h-4 mr-1" />Mark Present</>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Student Tab */}
        <TabsContent value="add-student" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Student to Class</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="search">Search Students</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {enrolledStudents.length >= classData.max_capacity ? (
                <div className="text-center py-8">
                  <p className="text-amber-600">Class is at full capacity</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No available students found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <motion.div
                      key={client.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {client.first_name?.[0]}{client.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.first_name} {client.last_name}</p>
                          <p className="text-sm text-gray-500">{client.email}</p>
                          {client.phone && (
                            <p className="text-sm text-gray-500">{client.phone}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEnrollStudent(client.id)}
                        disabled={isLoading}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Enroll
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedClassDetailsModal;
