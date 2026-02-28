"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Filter, RefreshCw } from "lucide-react";
import { SchedulerProvider } from "@/providers/schedular-provider";
import SchedulerViewFilteration from "@/components/schedule/_components/view/schedular-view-filteration";
import ClassEvent from "@/components/schedule/ClassEvent";
import { useModal } from "@/providers/modal-context";
import ClassForm from "@/components/class/ClassForm";
import CustomModal from "@/components/ui/custom-modal";
import { Event } from "@/types";

// Extend Event interface to include classData
interface ClassEvent extends Event {
  classData?: any;
}

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<ClassEvent[]>([]);
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setOpen } = useModal();

  const fetchCalendarData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Calculate date range for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const params = new URLSearchParams({
        start_date: startOfMonth.toISOString().split('T')[0],
        end_date: endOfMonth.toISOString().split('T')[0],
      });

      if (selectedInstructor && selectedInstructor !== 'all') {
        params.append('instructor_id', selectedInstructor);
      }

      const response = await fetch(`/api/classes/calendar?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch calendar data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Convert string dates back to Date objects for the scheduler
        const eventsWithDateObjects = (data.events || [])
          .map((event: any) => {
            const startDate = new Date(event.startDate);
            const endDate = new Date(event.endDate);
            
            // Validate dates are valid
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              console.warn(`Skipping invalid event ${event.id}: Invalid dates`, {
                startDate: event.startDate,
                endDate: event.endDate
              });
              return null;
            }
            
            // Validate start is before end
            if (startDate >= endDate) {
              console.warn(`Skipping invalid event ${event.id}: Start time not before end time`, {
                startDate: startDate.toString(),
                endDate: endDate.toString()
              });
              return null;
            }
            
            return {
              ...event,
              startDate,
              endDate
            };
          })
          .filter((event: any): event is ClassEvent => event !== null); // Remove invalid events
          
        console.log(`📅 Loaded ${eventsWithDateObjects.length} valid events for calendar`);
        setEvents(eventsWithDateObjects);
      } else {
        throw new Error(data.error || 'Failed to fetch calendar data');
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load calendar data');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    fetchInstructors();
    fetchCalendarData();
  }, [selectedInstructor]);

  const handleAddClass = () => {
    setOpen(
      <CustomModal title="Create New Class">
        <ClassForm 
          bare={true}
          onCancel={() => setOpen(null)}
          onSubmit={async (classData) => {
            try {
              const response = await fetch('/api/classes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(classData),
              });

              if (response.ok) {
                setOpen(null);
                fetchCalendarData(); // Refresh calendar
              } else {
                const error = await response.json();
                alert(`Failed to create class: ${error.message || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('Error creating class:', error);
              alert('Error creating class');
            }
          }}
        />
      </CustomModal>
    );
  };

  const customEventModal = {
    CustomAddEventModal: {
      title: "Add Class",
      CustomForm: ({ register, errors }: { register: any; errors: any }) => (
        <ClassForm 
          bare={true}
          onCancel={() => setOpen(null)}
          onSubmit={async (classData: any) => {
            try {
              const response = await fetch('/api/classes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(classData),
              });

              if (response.ok) {
                setOpen(null);
                fetchCalendarData(); // Refresh calendar
              } else {
                const error = await response.json();
                alert(`Failed to create class: ${error.message || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('Error creating class:', error);
              alert('Error creating class');
            }
          }}
        />
      )
    }
  };

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center">
              <div className="text-red-600 mb-4">
                <Calendar className="w-12 h-12 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Failed to Load Calendar</h3>
              </div>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={fetchCalendarData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              Class Calendar
            </h1>
            <p className="text-slate-600 mt-2">
              Manage and schedule swimming classes with calendar view
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Instructor Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by instructor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instructors</SelectItem>
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

            {/* Add Class Button */}
            <Button
              onClick={handleAddClass}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </Button>

            {/* Refresh Button */}
            <Button
              variant="outline"
              onClick={fetchCalendarData}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Classes</p>
                  <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Scheduled</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {events.filter(e => e.classData?.status === 'scheduled').length}
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {events.filter(e => e.classData?.status === 'in_progress').length}
                  </p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-700">Active</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {events.filter(e => e.classData?.status === 'completed').length}
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-700">Done</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <Card className="bg-white border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Calendar View
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                  <p className="text-gray-600">Loading calendar...</p>
                </div>
              </div>
            ) : (
              <SchedulerProvider 
                initialState={events}
                onAddEvent={(event) => {
                  // Handle add event if needed
                  fetchCalendarData();
                }}
              >
                <SchedulerViewFilteration 
                  CustomComponents={{
                    CustomEventComponent: (event: Event) => <ClassEvent event={{...event, classData: (event as ClassEvent).classData}} />,
                    CustomEventModal: customEventModal
                  }}
                />
              </SchedulerProvider>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPage;
