import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Users, Calendar as CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { SwimClass } from '@/types';

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

interface ClassListProps {
  classes: SwimClass[];
  isLoading: boolean;
  onEdit: (classData: SwimClass) => void;
  onDelete: (id: string) => void;
}

export default function ClassList({ classes, isLoading, onEdit, onDelete }: ClassListProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Classes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">All Classes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.map((classData: SwimClass) => (
                <TableRow key={classData.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium">{classData.name}</TableCell>
                  <TableCell>
                    {classData.instructor ? 
                      `${classData.instructor.first_name} ${classData.instructor.last_name}` : 
                      (classData.instructor_id ? classData.instructor_id : '-')
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <CalendarIcon className="w-4 h-4 text-slate-400" />
                      {format(new Date(classData.date), 'd MMM yyyy')} at {formatTime(classData.start_time)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-slate-400" />
                      {classData.current_enrollment || 0}/{classData.max_capacity || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {classData.class_type?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className={`${
                        classData.level === 'beginner' ? 'bg-green-100 text-green-700' :
                        classData.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                        classData.level === 'advanced' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {classData.level?.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className={`${
                        classData.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        classData.status === 'in_progress' ? 'bg-green-100 text-green-700' :
                        classData.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                        'bg-red-100 text-red-700'
                      }`}
                    >
                      {classData.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(classData)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(classData.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {classes.length === 0 && (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No classes found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}