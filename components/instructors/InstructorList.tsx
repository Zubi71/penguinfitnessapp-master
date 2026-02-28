import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar,
  User,
  Award
} from "lucide-react";
import { format } from "date-fns";
import type { InstructorData } from "@/entities";

interface InstructorListProps {
  instructors: InstructorData[];
  isLoading: boolean;
  onEdit: (instructor: InstructorData) => void;
  onDelete: (instructorId: string) => void;
}

export default function InstructorList({ 
  instructors, 
  isLoading, 
  onEdit, 
  onDelete
}: InstructorListProps) {
  
  const handleDelete = (instructorId: string, instructorName: string) => {
    if (window.confirm(`Are you sure you want to delete ${instructorName}? This action cannot be undone.`)) {
      onDelete(instructorId);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-8" />
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-900">
            Instructors ({instructors.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {instructors.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No instructors found</h3>
            <p className="text-slate-500">
              Get started by adding your first instructor.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {instructors.map((instructor) => (
              <div
                key={instructor.id}
                className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {instructor.first_name?.charAt(0)}{instructor.last_name?.charAt(0)}
                  </div>
                </div>

                {/* Instructor Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="text-sm font-medium text-slate-900 truncate">
                      {instructor.first_name} {instructor.last_name}
                    </h3>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Trainer
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    {instructor.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-48">{instructor.email}</span>
                      </div>
                    )}
                    {instructor.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{instructor.phone}</span>
                      </div>
                    )}
                    {instructor.hire_date && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Since: {format(new Date(instructor.hire_date), 'MMM yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hire Date */}
                <div className="hidden sm:block">
                  <Badge variant="outline">
                    {instructor.hire_date ? new Date(instructor.hire_date).getFullYear() : 'Active'}
                  </Badge>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(instructor)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(instructor.id!, `${instructor.first_name} ${instructor.last_name}`)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
