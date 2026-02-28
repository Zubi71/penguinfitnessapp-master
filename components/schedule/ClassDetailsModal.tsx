"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Edit, 
  Users, 
  Clock, 
  MapPin, 
  Calendar, 
  DollarSign,
  User,
  Phone,
  Mail
} from "lucide-react";

interface ClassDetailsModalProps {
  classData: any;
  onClose: () => void;
  onEdit: (e: React.MouseEvent) => void;
}

const ClassDetailsModal: React.FC<ClassDetailsModalProps> = ({ 
  classData, 
  onClose, 
  onEdit 
}) => {
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

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    try {
      const time = new Date(`1970-01-01T${timeString}`);
      return time.toLocaleString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{classData?.name || 'Class Details'}</h2>
          <Badge 
            variant="outline" 
            className={`mt-2 ${getStatusColor(classData?.status || 'scheduled')}`}
          >
            {(classData?.status || 'scheduled').replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        <Button onClick={onEdit} className="flex items-center gap-2">
          <Edit className="w-4 h-4" />
          Edit Class
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Class Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Date</label>
              <p className="text-gray-900">{formatDate(classData?.date)}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-600">Time</label>
              <div className="flex items-center gap-1 text-gray-900">
                <Clock className="w-4 h-4" />
                <span>
                  {formatTime(classData?.start_time)} - {formatTime(classData?.end_time)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Duration</label>
              <p className="text-gray-900">
                {classData?.duration_minutes ? `${classData.duration_minutes} minutes` : 'N/A'}
              </p>
            </div>

            {classData?.location && (
              <div>
                <label className="text-sm font-medium text-gray-600">Location</label>
                <div className="flex items-center gap-1 text-gray-900">
                  <MapPin className="w-4 h-4" />
                  <span>{classData.location}</span>
                </div>
              </div>
            )}

            {classData?.price && (
              <div>
                <label className="text-sm font-medium text-gray-600">Price</label>
                <div className="flex items-center gap-1 text-gray-900">
                  <DollarSign className="w-4 h-4" />
                  <span>${classData.price}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enrollment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Enrollment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Enrollment</label>
              <p className="text-gray-900">
                {classData?.enrollment_count || 0} / {classData?.max_capacity || 0} students
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Class Type</label>
              <p className="text-gray-900 capitalize">
                {classData?.class_type?.replace('_', ' ') || 'N/A'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Level</label>
              <p className="text-gray-900 capitalize">
                {classData?.level || 'N/A'}
              </p>
            </div>

            {classData?.lessons_per_package && (
              <div>
                <label className="text-sm font-medium text-gray-600">Lessons per Package</label>
                <p className="text-gray-900">{classData.lessons_per_package} lessons</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructor Information */}
        {classData?.instructor && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Instructor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900">{classData.instructor_name}</p>
              </div>

              {classData.instructor.email && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <div className="flex items-center gap-1 text-gray-900">
                    <Mail className="w-4 h-4" />
                    <a 
                      href={`mailto:${classData.instructor.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {classData.instructor.email}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Enrolled Students */}
        {classData?.enrolled_clients && classData.enrolled_clients.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Enrolled Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {classData.enrolled_clients.map((enrollment: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {enrollment.client?.first_name} {enrollment.client?.last_name}
                      </p>
                      {enrollment.client?.email && (
                        <p className="text-sm text-gray-600">{enrollment.client.email}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Description */}
      {classData?.description && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{classData.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {classData?.notes && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{classData.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Class
        </Button>
      </div>
    </div>
  );
};

export default ClassDetailsModal;
