import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Save, Calendar, Clock, Users, Send } from "lucide-react";
import { toast } from "sonner";
import type { ClassData, TrainerData } from "@/entities";

interface ClassFormProps {
  classData?: ClassData | null;
  onSubmit: (data: Partial<ClassData>) => void;
  onCancel: () => void;
  bare?: boolean; // When true, renders without modal wrapper (for use inside CustomModal)
}

const LESSON_TITLES = [
  '1-to-1 Personal Training Session',
  'Buddy Personal Training Session',
  'Group Strength Training (GST)',
  'Online Personal Training Session',
  'Fitness Assessment & Planning',
  'Weight Loss Training',
  'Muscle Building Training',
  'Functional Fitness Training',
  'HIIT Training Session',
  'Strength & Conditioning',
  'Core Strengthening Session',
  'Flexibility & Mobility Training',
];

const FITNESS_LOCATIONS = [
  'Main Studio',
  'Strength Room',
  'Cardio Zone',
  'Functional Training Area',
  'Group Exercise Studio',
  'Outdoor Training Area',
  'Client\'s Home',
  'Online Session',
  'Community Center',
  'Public Park',
  'Partner Gym - Anytime Fitness',
  'Partner Gym - True Fitness',
  'Partner Gym - Fitness First',
];
const MEMBERSHIP_TYPES = [
  // 1-to-1 Personal Training
  { label: '1-to-1 Personal Training - Ad-hoc Session', value: '1-to-1-adhoc', price: 180, lessons: 1, duration: 60, capacity: 1, validity: null },
  { label: '1-to-1 Personal Training - 10 Sessions', value: '1-to-1-10sessions', price: 1500, lessons: 10, duration: 60, capacity: 1, validity: '3 months' },
  { label: '1-to-1 Personal Training - 24 Sessions', value: '1-to-1-24sessions', price: 3350, lessons: 24, duration: 60, capacity: 1, validity: '6 months' },
  { label: '1-to-1 Personal Training - 36 Sessions', value: '1-to-1-36sessions', price: 4500, lessons: 36, duration: 60, capacity: 1, validity: '8 months' },
  
  // Buddy Personal Training
  { label: 'Buddy Personal Training - 10 Sessions', value: 'buddy-10sessions', price: 1500, lessons: 10, duration: 60, capacity: 2, validity: '3 months' },
  { label: 'Buddy Personal Training - 24 Sessions', value: 'buddy-24sessions', price: 3500, lessons: 24, duration: 60, capacity: 2, validity: '6 months' },
  
  // Group Strength Training
  { label: 'Group Strength Training - 8 Sessions', value: 'gst-8sessions', price: 299, lessons: 8, duration: 40, capacity: 8, validity: '1 month' },
  { label: 'Group Strength Training - 8-Week Programme', value: 'gst-8week', price: 999, lessons: 24, duration: 40, capacity: 8, validity: '8 weeks' },
  
  // Online Personal Training
  { label: 'Online Personal Training - Elite Plan', value: 'online-elite', price: 199, lessons: 1, duration: 60, capacity: 1, validity: '1 month' }
];

export default function ClassForm({ classData, onSubmit, onCancel, bare = false }: ClassFormProps) {
  const [trainers, setTrainers] = useState<TrainerData[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [enrolledClients, setEnrolledClients] = useState<any[]>([]);
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [sendingReminder, setSendingReminder] = useState(false);
  
  // Initialize form with proper capacity based on membership type
  const getInitialCapacity = () => {
    if (classData?.membership_type) {
      const membershipType = MEMBERSHIP_TYPES.find(m => m.value === classData.membership_type);
      return membershipType?.capacity || classData?.max_capacity || 1;
    }
    return classData?.max_capacity || 1;
  };
  
  const [form, setForm] = useState({
    title: classData?.title || '',
    membership_type: classData?.membership_type || '',
    name: classData?.name || '',
    description: classData?.description || '',
    instructor_id: classData?.instructor_id || '',
    level: classData?.level || 'beginner',
    max_capacity: getInitialCapacity(),
    current_enrollment: classData?.current_enrollment || 0,
    date: classData?.date ? new Date(classData.date).toISOString().split('T')[0] : '',
    start_time: classData?.start_time || '',
    end_time: classData?.end_time || '',
    duration_minutes: classData?.duration_minutes || 45,
    lessons_per_package: classData?.lessons_per_package || 4,
    location: classData?.location || '',
    price: classData?.price || 0,
    status: classData?.status || 'scheduled',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reminder modal state
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{
    id?: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    loadTrainers();
    loadClients();
    if (classData?.id) {
      loadEnrolledClients();
    }
  }, [classData]);

  const loadTrainers = async () => {
    try {
      const response = await fetch('/api/trainers');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const trainerData = await response.json();
      console.log('Loaded trainers:', trainerData);
      setTrainers(trainerData);
    } catch (error) {
      console.error('Error loading trainers:', error);
    }
  };

  const loadClients = async () => {
    try {
      console.log('Loading clients...');
      const response = await fetch('/api/clients');
      console.log('Clients API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Clients API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }
      
      const clientData = await response.json();
      console.log('Raw client data:', clientData);
      
      // Show clients with any status except 'declined' - admins should be able to add any confirmed/approved/pending clients
      const availableClients = clientData.filter((client: any) => client.status !== 'declined');
      console.log('Filtered available clients (excluding declined):', availableClients);
      
      setClients(availableClients);
    } catch (error) {
      console.error('Error loading clients:', error);
      // Show user-friendly error message only if this is an active form (classData exists)
      if (classData?.id) {
        alert(`Failed to load clients: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for details.`);
      }
    }
  };

  const loadEnrolledClients = async () => {
    if (!classData?.id) return;
    
    try {
      console.log('Loading enrolled clients for class:', classData.id);
      const response = await fetch(`/api/enrollments?class_id=${classData.id}`);
      console.log('Enrollments API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Enrollments API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }
      
      const enrollmentData = await response.json();
      console.log('Enrollment data:', enrollmentData);
      
      setEnrolledClients(enrollmentData);
    } catch (error) {
      console.error('Error loading enrolled clients:', error);
      alert(`Failed to load enrolled students: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for details.`);
    }
  };

  // Update available clients when clients or enrolled clients change
  useEffect(() => {
    console.log('Updating available clients...');
    console.log('All clients:', clients);
    console.log('Enrolled clients:', enrolledClients);
    
    const enrolled = enrolledClients.map(e => e.client_id);
    console.log('Enrolled client IDs:', enrolled);
    
    const available = clients.filter(client => !enrolled.includes(client.id));
    console.log('Available clients:', available);
    
    setAvailableClients(available);
  }, [clients, enrolledClients]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Class name is required";
    if (!form.instructor_id.trim()) newErrors.instructor_id = "Trainer is required";
    if (!form.date) newErrors.date = "Date is required";
    if (!form.start_time) newErrors.start_time = "Start time is required";
    if (!form.end_time) newErrors.end_time = "End time is required";
    if (form.max_capacity < 1) newErrors.max_capacity = "Capacity must be at least 1";
    if (form.price < 0) newErrors.price = "Price cannot be negative";
    
    // Validate date is not in the past (unless editing existing class)
    if (form.date && !classData) {
      const selectedDate = new Date(form.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.date = "Cannot schedule class in the past";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(form);
    }
  };

  const handleAddStudent = async (clientId: string, sendInvoice: boolean = false) => {
    if (!classData?.id) {
      alert('Please save the class first before adding students');
      return;
    }

    try {
      // First, add the student to the class
      const response = await fetch('/api/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          class_id: classData.id,
          enrollment_date: new Date().toISOString(),
          status: 'active',
          payment_status: 'pending'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add student');
      }

      const enrollmentData = await response.json();

      // If sendInvoice is true, create and send invoice
      if (sendInvoice) {
        // Validate that price is set before creating invoice
        if (!form.price || form.price <= 0) {
          alert('Cannot create invoice: Class price is not set. Please set a price for the class first.');
          return;
        }

        try {
          console.log('Creating invoice with form data:', {
            client_id: clientId,
            class_id: classData.id,
            enrollment_id: enrollmentData.id,
            amount: form.price,
            total_amount: form.price,
            form_price: form.price,
            form_data: form
          });

          const invoiceResponse = await fetch('/api/invoices', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: clientId,
              class_id: classData.id,
              enrollment_id: enrollmentData.id,
              amount: form.price,
              total_amount: form.price,
              due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
              description: `Invoice for ${form.name} - ${form.title}`,
              line_items: [{
                description: `${form.name} - ${form.title}`,
                quantity: 1,
                unit_price: form.price,
                total: form.price
              }],
              status: 'sent'
            }),
          });

          if (!invoiceResponse.ok) {
            const invoiceError = await invoiceResponse.json();
            console.error('Invoice creation failed:', invoiceError);
            alert(`Student added successfully, but invoice creation failed: ${invoiceError.error || 'Unknown error'}`);
          } else {
            alert('Student added successfully and invoice sent!');
          }
        } catch (invoiceError) {
          console.error('Invoice creation error:', invoiceError);
          alert('Student added successfully, but invoice sending failed. Please create invoice manually.');
        }
      } else {
        alert('Student added successfully!');
      }

      // Refresh the enrolled clients list
      loadEnrolledClients();
    } catch (error) {
      console.error('Error adding student:', error);
      alert(`Failed to add student: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRemoveStudent = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to remove this student from the class?')) {
      return;
    }

    try {
      const response = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove student');
      }

      // Refresh the enrolled clients list
      loadEnrolledClients();
    } catch (error) {
      console.error('Error removing student:', error);
      alert(`Failed to remove student: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };
const handleSendReminder = async () => {
    if (!classData?.id || enrolledClients.length === 0) {
      alert('No enrolled students to send reminders to.');
      return;
    }

    setSendingReminder(true);
    
    try {
      const response = await fetch(`/api/classes/${classData.id}/reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reminderType: 'all'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send reminders: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const { results } = result;
        alert(
          `Reminders sent successfully!\n` +
          `✅ Emails sent: ${results.sent.email}\n` +
          `✅ WhatsApp messages sent: ${results.sent.whatsapp}\n` +
          `❌ Failed: ${results.sent.failed}`
        );
      } else {
        throw new Error(result.message || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert(`Failed to send reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingReminder(false);
    }
  };

  const formContent = (
    <Card className={bare ? "w-full" : "w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white"}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">
          {classData ? "Edit Class" : "Create New Class"}
        </CardTitle>
        {!bare && (
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Lesson Title</Label>
                <Select value={form.title} onValueChange={value => handleInputChange('title', value)}>
                  <SelectTrigger className={errors.title ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select lesson title" />
                  </SelectTrigger>
                  <SelectContent>
                    {LESSON_TITLES.map(title => (
                      <SelectItem key={title} value={title}>{title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="membership_type">Membership Type</Label>
                <Select
                  value={form.membership_type}
                  onValueChange={value => {
                    const selected = MEMBERSHIP_TYPES.find(m => m.value === value)
                    handleInputChange('membership_type', value)
                    if (selected) {
                      handleInputChange('price', selected.price)
                      handleInputChange('lessons_per_package', selected.lessons)
                      handleInputChange('duration_minutes', selected.duration)
                      handleInputChange('max_capacity', selected.capacity)
                    }
                  }}
                >
                  <SelectTrigger className={errors.membership_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select group type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBERSHIP_TYPES.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        <div className="flex flex-col w-full">
                          <span className="font-medium">{m.label}</span>
                          <span className="text-sm text-slate-500">
                            SGD {m.price} • {m.lessons} session{m.lessons > 1 ? 's' : ''} • {m.duration}min • Max {m.capacity}
                            {m.validity && ` • ${m.validity} validity`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.membership_type && <p className="text-sm text-red-500">{errors.membership_type}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Class Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Morning Personal Training"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructor_id">Trainer *</Label>
                <Select value={form.instructor_id} onValueChange={(value) => handleInputChange("instructor_id", value)}>
                  <SelectTrigger className={errors.instructor_id ? "border-red-500" : ""}>
                    <SelectValue placeholder={
                      trainers.length === 0 
                        ? "No trainers available" 
                        : "Select a trainer"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers.length === 0 ? (
                      <div className="p-3 text-center text-gray-500">
                        <p className="text-sm">No trainers found</p>
                        <p className="text-xs mt-1">Register trainers first</p>
                      </div>
                    ) : (
                      trainers.map((trainer) => (
                        <SelectItem key={trainer.id} value={trainer.id!}>
                          <div className="flex items-center justify-between w-full">
                            <span>
                              {trainer.first_name} {trainer.last_name}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.instructor_id && <p className="text-sm text-red-500">{errors.instructor_id}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Class description..."
                rows={3}
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  min={new Date().toISOString().split('T')[0]} // Can't schedule in the past
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  className={errors.date ? "border-red-500" : ""}
                />
                {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time *</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => handleInputChange("start_time", e.target.value)}
                  className={errors.start_time ? "border-red-500" : ""}
                />
                {errors.start_time && <p className="text-sm text-red-500">{errors.start_time}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">End Time *</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => handleInputChange("end_time", e.target.value)}
                  className={errors.end_time ? "border-red-500" : ""}
                />
                {errors.end_time && <p className="text-sm text-red-500">{errors.end_time}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  min="0"
                  value={form.duration_minutes}
                  onChange={(e) => handleInputChange("duration_minutes", parseInt(e.target.value))}
                  className={errors.duration_minutes ? "border-red-500" : ""}
                />
                {errors.duration_minutes && <p className="text-sm text-red-500">{errors.duration_minutes}</p>}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Class Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_capacity">Capacity *</Label>
                <Input
                  id="max_capacity"
                  type="number"
                  min="1"
                  max="20"
                  value={form.max_capacity}
                  onChange={(e) => handleInputChange("max_capacity", parseInt(e.target.value))}
                  className={errors.max_capacity ? "border-red-500" : ""}
                  disabled={!!form.membership_type}
                  placeholder={form.membership_type ? "Auto-set by membership type" : "Enter capacity"}
                />
                {errors.max_capacity && <p className="text-sm text-red-500">{errors.max_capacity}</p>}
                {form.membership_type && (
                  <p className="text-xs text-slate-500">
                    Capacity automatically set based on membership type
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_enrollment">Current Participants</Label>
                <Input
                  id="current_enrollment"
                  type="number"
                  min="0"
                  value={form.current_enrollment}
                  onChange={(e) => handleInputChange("current_enrollment", parseInt(e.target.value))}
                  className={errors.current_enrollment ? "border-red-500" : ""}
                />
                {errors.current_enrollment && <p className="text-sm text-red-500">{errors.current_enrollment}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lessons_per_package">Lessons per Package</Label>
                <Input
                  id="lessons_per_package"
                  type="number"
                  min="1"
                  value={form.lessons_per_package}
                  onChange={(e) => handleInputChange("lessons_per_package", parseInt(e.target.value))}
                  className={errors.lessons_per_package ? "border-red-500" : ""}
                />
                {errors.lessons_per_package && <p className="text-sm text-red-500">{errors.lessons_per_package}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (SGD) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => handleInputChange("price", parseFloat(e.target.value))}
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Difficulty Level</Label>
                <Select value={form.level} onValueChange={(value) => handleInputChange("level", value)}>
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

              <div className="space-y-2">
                <Label htmlFor="location">Training Location</Label>
                <Select value={form.location} onValueChange={(value) => handleInputChange("location", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select training location" />
                  </SelectTrigger>
                  <SelectContent>
                    {FITNESS_LOCATIONS.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(value) => handleInputChange("status", value)}>
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
            </div>
          </div>

          {/* Student Enrollment Management - Only show for existing classes */}
          {classData?.id && (
            <div className="space-y-6">
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Student Enrollment ({enrolledClients.length}/{form.max_capacity})
                    </h3>
                  </div>

                {/* Enrolled Students */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Enrolled Students</h4>
                    {enrolledClients.length > 0 ? (
                      <div className="space-y-2">
                        {enrolledClients.map((enrollment) => (
                          <div key={enrollment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {enrollment.client?.first_name} {enrollment.client?.last_name}
                                </p>
                                <p className="text-sm text-slate-600">{enrollment.client?.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Payment Status Badge */}
                              <Badge 
                                variant={enrollment.payment_status === 'paid' ? 'default' : 'secondary'}
                                className={enrollment.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                              >
                                {enrollment.payment_status}
                              </Badge>
                              
                              {/* Invoice Status Badge */}
                              {enrollment.invoice && enrollment.invoice.length > 0 && (
                                <Badge 
                                  variant={enrollment.invoice[0].status === 'paid' ? 'default' : 'outline'}
                                  className={
                                    enrollment.invoice[0].status === 'paid' 
                                      ? 'bg-blue-100 text-blue-700' 
                                      : enrollment.invoice[0].status === 'sent'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }
                                >
                                  Invoice {enrollment.invoice[0].status}
                                </Badge>
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveStudent(enrollment.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm italic">No students enrolled yet</p>
                    )}
                  </div>

                  {/* Available Students to Add */}
                  {classData?.id && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Add Students</h4>
                      {availableClients.length > 0 && enrolledClients.length < form.max_capacity ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {availableClients.map((client) => (
                            <div key={client.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                  <Users className="w-4 h-4 text-slate-600" />
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <p className="font-medium text-slate-900">
                                      {client.first_name} {client.last_name}
                                    </p>
                                    <Badge 
                                      variant="outline"
                                      className={
                                        client.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        client.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                        client.status === 'enrolled' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                                      }
                                    >
                                      {client.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-slate-600">{client.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm" 
                                  onClick={() => handleAddStudent(client.id, false)}
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  Add
                                </Button>
                                <Button
                                  type="button"
                                  variant="default"
                                  size="sm" 
                                  onClick={() => handleAddStudent(client.id, true)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Add & Invoice
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : clients.length === 0 ? (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-700">
                            <strong>No clients found.</strong> This could mean:
                          </p>
                          <ul className="text-xs text-yellow-600 mt-2 space-y-1">
                            <li>• No clients have been registered yet</li>
                            <li>• There's an issue loading clients from the API</li>
                            <li>• All clients have been declined</li>
                          </ul>
                          <p className="text-xs text-yellow-600 mt-2">
                            <strong>Note:</strong> Clients with pending, confirmed, approved, or enrolled status will be shown here.
                          </p>
                          <div className="mt-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                loadClients();
                                loadEnrolledClients();
                              }}
                              className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                            >
                              🔄 Refresh Data
                            </Button>
                          </div>
                        </div>
                      ) : enrolledClients.length >= form.max_capacity ? (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-700">
                            This class is at full capacity ({form.max_capacity} students). Remove a student to add another.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-700">
                            All {clients.length} available students are already enrolled in this class.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {enrolledClients.length >= form.max_capacity && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-700">
                        This class is at full capacity. Remove a student to add another.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t">
            <div>
              {classData?.id && enrolledClients.length > 0 && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleSendReminder}
                  disabled={sendingReminder}
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendingReminder ? "Sending..." : "Send Reminder"}
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {classData ? "Update Class" : "Create Class"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      {formContent}
    </div>
  );
}
