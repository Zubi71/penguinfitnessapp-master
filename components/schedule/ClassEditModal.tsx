"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, X, Calendar, Clock, Users, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface ClassEditModalProps {
  classData: any;
  onClose: () => void;
  onSave: (updatedClass: any) => void;
}

const ClassEditModal: React.FC<ClassEditModalProps> = ({ 
  classData, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    name: classData?.name || '',
    description: classData?.description || '',
    date: classData?.date || '',
    start_time: classData?.start_time || '',
    end_time: classData?.end_time || '',
    duration_minutes: classData?.duration_minutes || 45,
    max_capacity: classData?.max_capacity || 1,
    price: classData?.price || 0,
    location: classData?.location || '',
    status: classData?.status || 'scheduled',
    class_type: classData?.class_type || 'private',
    level: classData?.level || 'beginner',
    notes: classData?.notes || '',
    instructor_id: classData?.instructor_id || 'none',
  });

  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch instructors
    const fetchInstructors = async () => {
      try {
        const response = await fetch('/api/instructors');
        if (response.ok) {
          const data = await response.json();
          setInstructors(data);
        }
      } catch (error) {
        console.error('Error fetching instructors:', error);
      }
    };

    fetchInstructors();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Prepare data for submission, converting "none" instructor_id to null
      const submitData = {
        ...formData,
        instructor_id: formData.instructor_id === 'none' ? null : formData.instructor_id
      };

      const response = await fetch(`/api/classes/${classData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        const updatedClass = await response.json();
        onSave(updatedClass);
      } else {
        const error = await response.json();
        alert(`Failed to update class: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating class:', error);
      alert('Error updating class');
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Class</h2>
          <Badge 
            variant="outline" 
            className={`mt-2 ${getStatusColor(formData.status)}`}
          >
            {formData.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter class name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter class description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter location"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Schedule & Timing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 0)}
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Class Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Class Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="class_type">Class Type</Label>
              <Select value={formData.class_type} onValueChange={(value) => handleInputChange('class_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="semi-private">Semi-Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="level">Level</Label>
              <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="all">All Levels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="max_capacity">Max Capacity</Label>
              <Input
                id="max_capacity"
                type="number"
                value={formData.max_capacity}
                onChange={(e) => handleInputChange('max_capacity', parseInt(e.target.value) || 1)}
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="instructor_id">Instructor</Label>
              <Select 
                value={formData.instructor_id} 
                onValueChange={(value) => handleInputChange('instructor_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select instructor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No instructor assigned</SelectItem>
                  {instructors
                    .filter((instructor: any) => instructor.id && instructor.id.toString().trim() !== '')
                    .map((instructor: any) => (
                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.first_name} {instructor.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Current Enrollment</div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="font-medium">
                  {classData?.enrollment_count || 0} / {formData.max_capacity} students
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default ClassEditModal;
