import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, MoreVertical, Calendar, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

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

// TypeScript interface for class data
interface ClassData {
  id: string | number;
  name: string;
  instructor_id?: string;
  instructor_name?: string;
  status: string;
  date: string;
  start_time: string;
  end_time: string;
  current_enrollment?: number;
  max_capacity?: number;
  enrolled_count?: number;
  capacity?: number;
  class_type?: string;
  level?: string;
}

interface TodaysClassesProps {
  classes?: ClassData[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const ClassCard: React.FC<{ classData: ClassData; onRefresh?: () => void }> = ({ classData, onRefresh }) => {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/dashboard/classes?action=edit&id=${classData.id}`);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this class?')) {
      try {
        const response = await fetch(`/api/classes/${classData.id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          // Call refresh callback if provided, otherwise reload page
          if (onRefresh) {
            onRefresh();
          } else {
            window.location.reload();
          }
        } else {
          alert('Failed to delete class');
        }
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Error deleting class');
      }
    }
  };

  const enrollmentCount = classData.current_enrollment ?? classData.enrolled_count ?? 0;
  const maxCapacity = classData.max_capacity ?? classData.capacity ?? 0;
  const displayTime = classData.start_time && classData.end_time 
    ? `${formatTime(classData.start_time)} - ${formatTime(classData.end_time)}`
    : classData.start_time ? formatTime(classData.start_time) : 'Time TBD';

  return (
    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">{classData.name}</h3>
            <p className="text-slate-600 text-sm">{classData.instructor_name || classData.instructor_id || 'No instructor assigned'}</p>
          </div>
          <Badge
            variant="secondary"
            className={
              classData.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
              classData.status === 'in_progress' ? 'bg-green-100 text-green-700' :
              classData.status === 'completed' ? 'bg-slate-100 text-slate-700' :
              'bg-red-100 text-red-700'
            }
          >
            {classData.status.replace('_', ' ')}
          </Badge>
        </div>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4" />
            <span>{displayTime}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Users className="w-4 h-4" />
            <span>{enrollmentCount}/{maxCapacity} enrolled</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="text-xs">
            {classData.class_type?.replace('_', ' ') || classData.level?.replace('_', ' ') || 'N/A'}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Class
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Class
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

const TodaysClasses: React.FC<TodaysClassesProps> = ({ classes = [], isLoading = false, onRefresh }) => {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">Today's Classes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No classes scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classes.map((classData) => (
              <ClassCard key={classData.id} classData={classData} onRefresh={onRefresh} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodaysClasses;
