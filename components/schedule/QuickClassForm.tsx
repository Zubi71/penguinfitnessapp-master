"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, X, Calendar, Clock, Users } from "lucide-react";

interface QuickClassFormProps {
  initialDate?: Date;
  initialTime?: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const QuickClassForm: React.FC<QuickClassFormProps> = ({ 
  initialDate, 
  initialTime, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    start_time: initialTime || '09:00',
    end_time: initialTime ? 
      new Date(new Date(`1970-01-01T${initialTime}`).getTime() + 45 * 60000).toTimeString().slice(0, 5) 
      : '09:45',
    duration_minutes: 45,
    max_capacity: 1,
    price: 340,
    location: '',
    status: 'scheduled',
    class_type: 'private',
    level: 'beginner',
    instructor_id: 'none',
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
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate end time when start time or duration changes
      if (field === 'start_time' || field === 'duration_minutes') {
        const startTime = field === 'start_time' ? value : prev.start_time;
        const duration = field === 'duration_minutes' ? value : prev.duration_minutes;
        
        if (startTime && duration) {
          const startDate = new Date(`1970-01-01T${startTime}`);
          const endDate = new Date(startDate.getTime() + duration * 60000);
          updated.end_time = endDate.toTimeString().slice(0, 5);
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Prepare data for submission, converting "none" instructor_id to null
      const submitData = {
        ...formData,
        instructor_id: formData.instructor_id === 'none' ? null : formData.instructor_id
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Quick Add Class</h3>
        <Badge variant="outline" className="text-blue-600 border-blue-200">
          {formData.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Class Name */}
        <div className="md:col-span-2">
          <Label htmlFor="name">Class Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Private Swimming Lesson"
            required
          />
        </div>

        {/* Date */}
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            required
          />
        </div>

        {/* Start Time */}
        <div>
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => handleInputChange('start_time', e.target.value)}
            required
          />
        </div>

        {/* Duration */}
        <div>
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Select 
            value={formData.duration_minutes.toString()} 
            onValueChange={(value) => handleInputChange('duration_minutes', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">60 minutes</SelectItem>
              <SelectItem value="90">90 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* End Time (Auto-calculated) */}
        <div>
          <Label htmlFor="end_time">End Time</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => handleInputChange('end_time', e.target.value)}
            required
          />
        </div>

        {/* Class Type */}
        <div>
          <Label htmlFor="class_type">Class Type</Label>
          <Select 
            value={formData.class_type} 
            onValueChange={(value) => handleInputChange('class_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private (1-on-1)</SelectItem>
              <SelectItem value="group">Group</SelectItem>
              <SelectItem value="semi-private">Semi-Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Capacity */}
        <div>
          <Label htmlFor="max_capacity">Max Capacity</Label>
          <Input
            id="max_capacity"
            type="number"
            value={formData.max_capacity}
            onChange={(e) => handleInputChange('max_capacity', parseInt(e.target.value) || 1)}
            min="1"
            max="10"
          />
        </div>

        {/* Instructor */}
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

        {/* Price */}
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

        {/* Location */}
        <div className="md:col-span-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Swimming complex or pool location"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Additional details about the class"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Creating...' : 'Create Class'}
        </Button>
      </div>
    </form>
  );
};

export default QuickClassForm;
