import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from 'lucide-react';
import { format } from "date-fns";
import type { ClientData, ClassData } from "@/entities";
import { Attendance } from "@/entities/Attendance";
import { Enrollment } from "@/entities/Enrollment";

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

interface CreateBatchFormProps {
  clients: ClientData[];
  classes: ClassData[];
  onSubmit: (formData: {
    client_id: string;
    class_id: string;
    amount: number;
  }) => void;
  onCancel: () => void;
}

export default function CreateBatchForm({ clients, classes, onSubmit, onCancel }: CreateBatchFormProps) {
  const [formData, setFormData] = useState({
    client_id: "",
    class_id: "",
    amount: 120 // Default price for enrollment
  });

  // New state for attendance and enrollments
  const [attendance, setAttendance] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loadingInfo, setLoadingInfo] = useState(false);

  useEffect(() => {
    async function fetchClientInfo() {
      if (!formData.client_id) {
        setAttendance([]);
        setEnrollments([]);
        return;
      }
      setLoadingInfo(true);
      try {
        const [att, enr] = await Promise.all([
          Attendance.getByClientId(formData.client_id),
          Enrollment.getByClient(formData.client_id)
        ]);
        setAttendance(att);
        setEnrollments(enr);
      } catch (e) {
        setAttendance([]);
        setEnrollments([]);
      }
      setLoadingInfo(false);
    }
    fetchClientInfo();
  }, [formData.client_id]);

  // Helper to calculate remaining lessons (for package-based enrollments)
  const getRemainingLessons = () => {
    if (!enrollments.length) return null;
    // Assume latest active enrollment/package
    const active = enrollments.find((e: any) => e.status === 'active');
    if (!active) return null;
    // Find class info for lessons_per_package
    const classInfo = classes.find((c: any) => c.id === active.class_id);
    const lessonsPerPackage = classInfo?.lessons_per_package || 4;
    const attended = attendance.filter((a: any) => a.class_id === active.class_id && a.status === 'present').length;
    return lessonsPerPackage - attended;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClientChange = (clientId: string) => {
    setFormData(prev => ({
      ...prev,
      client_id: clientId
    }));
  };

  const handleClassChange = (classId: string) => {
    const classData = classes.find(c => c.id === classId);
    setFormData(prev => ({
      ...prev,
      class_id: classId,
      amount: classData ? classData.price || 120 : 120
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold">Create Enrollment</CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Select Student</Label>
              <Select value={formData.client_id} onValueChange={handleClientChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name} - {client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Select Class</Label>
              <Select value={formData.class_id} onValueChange={handleClassChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classData) => (
                    <SelectItem key={classData.id} value={classData.id!}>
                      {classData.name} - {formatTime(classData.start_time)} ({format(new Date(classData.date), 'd MMM yyyy')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Enrollment Details:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Single class enrollment</li>
                <li>• Payment due before class</li>
                <li>• Can be upgraded to package later</li>
              </ul>
            </div>

            {formData.client_id && (
              <div className="bg-slate-50 p-4 rounded-lg mt-2">
                <h4 className="font-semibold text-slate-900 mb-2">Student Info</h4>
                {loadingInfo ? (
                  <div className="text-xs text-slate-500">Loading attendance...</div>
                ) : (
                  <>
                    <div className="mb-2 text-sm">
                      <span className="font-medium">Remaining Lessons:</span> {getRemainingLessons() ?? 'N/A'}
                    </div>
                    <div className="mb-1 font-medium text-xs">Recent Attendance:</div>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {attendance.slice(0, 5).map((a: any, i: number) => (
                        <li key={a.id || i}>
                          {a.date}: <span className="font-semibold">{a.status}</span>
                        </li>
                      ))}
                      {attendance.length === 0 && <li>No attendance records</li>}
                    </ul>
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Create Enrollment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}