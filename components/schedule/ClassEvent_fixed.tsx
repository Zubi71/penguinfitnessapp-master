"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useModal } from "@/providers/modal-context";
import { Event } from "@/types";
import { Edit, Trash2, Users, Clock, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import CustomModal from "@/components/ui/custom-modal";
import ClassForm from "@/components/class/ClassForm";
import EnhancedClassDetailsModal from "@/components/schedule/EnhancedClassDetailsModal";

interface ClassEventProps {
  event: Event & {
    classData?: any;
    minmized?: boolean;
  };
  CustomEventModal?: any;
}

const ClassEvent: React.FC<ClassEventProps> = ({ event, CustomEventModal }) => {
  const { setOpen } = useModal();
  const { classData } = event;

  // Format time display
  const formatTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
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

  const handleEdit = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpen(
      <CustomModal title="Edit Class">
        <ClassForm 
          classData={classData} 
          onCancel={() => setOpen(null)}
          onSubmit={async (updatedClass: any) => {
            try {
              const response = await fetch(`/api/classes/${classData.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedClass),
              });

              if (response.ok) {
                setOpen(null);
                // Trigger refresh of calendar data
                window.location.reload();
              } else {
                const error = await response.json();
                alert(`Failed to update class: ${error.message || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('Error updating class:', error);
              alert('Error updating class');
            }
          }}
        />
      </CustomModal>
    );
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Are you sure you want to delete this class?')) {
      try {
        const response = await fetch(`/api/classes/${classData.id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          // Trigger refresh of calendar data
          window.location.reload();
        } else {
          alert('Failed to delete class');
        }
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Error deleting class');
      }
    }
  };

  const handleViewDetails = () => {
    setOpen(
      <CustomModal title={classData?.name || 'Class Details'}>
        <EnhancedClassDetailsModal 
          classData={classData} 
          onClose={() => setOpen(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </CustomModal>
    );
  };

  if (event.minmized) {
    return (
      <motion.div
        className={cn(
          "p-2 rounded-md text-xs cursor-pointer transition-all duration-200 hover:shadow-md",
          "border-l-4",
          event.variant === 'primary' ? 'bg-blue-50 border-blue-400' :
          event.variant === 'success' ? 'bg-green-50 border-green-400' :
          event.variant === 'warning' ? 'bg-yellow-50 border-yellow-400' :
          event.variant === 'danger' ? 'bg-red-50 border-red-400' :
          'bg-gray-50 border-gray-400'
        )}
        onClick={handleViewDetails}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="font-medium truncate">{event.title}</div>
        <div className="text-xs text-gray-600 mt-1">
          {formatTime(new Date(event.startDate))}
        </div>
        {classData && (
          <div className="flex items-center gap-1 mt-1">
            <Users className="w-3 h-3" />
            <span className="text-xs">
              {classData.enrollment_count || 0}/{classData.max_capacity || 0}
            </span>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(
        "p-3 rounded-lg border shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md",
        event.variant === 'primary' ? 'bg-blue-50 border-blue-200' :
        event.variant === 'success' ? 'bg-green-50 border-green-200' :
        event.variant === 'warning' ? 'bg-yellow-50 border-yellow-200' :
        event.variant === 'danger' ? 'bg-red-50 border-red-200' :
        'bg-gray-50 border-gray-200'
      )}
      onClick={handleViewDetails}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-sm truncate">{event.title}</h4>
          {classData?.instructor_name && (
            <p className="text-xs text-gray-600 mt-1">{classData.instructor_name}</p>
          )}
        </div>
        <div className="flex gap-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-blue-100"
            onClick={(e) => handleEdit(e)}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-red-100"
            onClick={(e) => handleDelete(e)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <Clock className="w-3 h-3" />
          <span>
            {formatTime(new Date(event.startDate))} - {formatTime(new Date(event.endDate))}
          </span>
        </div>

        {classData && (
          <>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Users className="w-3 h-3" />
              <span>
                {classData.enrollment_count || 0}/{classData.max_capacity || 0} enrolled
              </span>
            </div>

            {classData.location && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{classData.location}</span>
              </div>
            )}

            <div className="flex justify-between items-center mt-2">
              <Badge 
                variant="outline" 
                className={cn("text-xs", getStatusColor(classData.status || 'scheduled'))}
              >
                {(classData.status || 'scheduled').replace('_', ' ')}
              </Badge>
              
              {classData.price && (
                <span className="text-xs font-medium text-gray-700">
                  ${classData.price}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default ClassEvent;
