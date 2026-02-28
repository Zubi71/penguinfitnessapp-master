import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Calendar, CreditCard, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Enrollment, type EnrollmentData, type ClientData, type ClassData } from "@/entities";

import CreateBatchForm from "./createBatchForm";

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

interface BatchManagementProps {
  enrollments: EnrollmentData[];
  clients: ClientData[];
  classes: ClassData[];
  isLoading: boolean;
  onDataUpdate: () => void;
}

export default function BatchManagement({
  enrollments,
  clients,
  classes,
  isLoading,
  onDataUpdate
}: BatchManagementProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateEnrollment = async (enrollmentData: {
    client_id: string;
    class_id: string;
    amount: number;
  }) => {
    try {
      const newEnrollment = {
        client_id: enrollmentData.client_id,
        class_id: enrollmentData.class_id,
        enrollment_date: new Date().toISOString(),
        payment_status: 'pending' as const,
        amount_paid: enrollmentData.amount,
        status: 'active' as const
      };

      await Enrollment.create(newEnrollment);
      setShowCreateForm(false);
      onDataUpdate();
    } catch (error) {
      console.error('Error creating enrollment:', error);
    }
  };

  const handlePaymentUpdate = async (
    enrollmentId: string,
    status: 'paid' | 'pending' | 'overdue' | 'partial' | 'refunded'
  ) => {
    try {
      if (status === 'paid' || status === 'pending' || status === 'overdue') {
        await Enrollment.update(enrollmentId, {
          payment_status: status
        });
        onDataUpdate();
      }
      // Optionally, handle or log other statuses (partial, refunded)
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'transferred': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'partial': return 'bg-orange-100 text-orange-700';
      case 'refunded': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Lesson Batches</CardTitle>
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
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Enrollment Management
            </CardTitle>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Enrollment
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Batches Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Enrollment Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => {
                  const client = clients.find(c => c.id === enrollment.client_id);
                  const classData = classes.find(c => c.id === enrollment.class_id);
                  return (
                    <TableRow key={enrollment.id} className="hover:bg-slate-50">
                      <TableCell>
                        <div>
                          <div className="font-medium text-slate-900">
                            {client ? `${client.first_name} ${client.last_name}` : 'Unknown Client'}
                          </div>
                          <div className="text-sm text-slate-500">{client?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{classData?.name || 'Unknown Class'}</div>
                          <div className="text-sm text-slate-500">
                            {classData?.date ? format(new Date(classData.date), 'd MMM yyyy') : 'N/A'} at {classData?.start_time ? formatTime(classData.start_time) : 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-slate-600">
                            <Calendar className="w-3 h-3" />
                            {enrollment.enrollment_date ? format(new Date(enrollment.enrollment_date), 'MMM d, yyyy') : 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          Payment Status
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge 
                            variant="secondary"
                            className={getPaymentStatusColor(enrollment.payment_status || 'pending')}
                          >
                            {enrollment.payment_status || 'pending'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={getStatusColor(enrollment.status || 'active')}
                        >
                          {enrollment.status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {enrollment.payment_status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handlePaymentUpdate(enrollment.id!, 'paid')}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {enrollments.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No enrollments found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Enrollment Form Modal */}
      {showCreateForm && (
        <CreateBatchForm
          clients={clients}
          classes={classes}
          onSubmit={handleCreateEnrollment}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
}