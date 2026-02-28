import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Loader2, Save, X, User, Calendar, FileText, Users } from "lucide-react";
import type { ClientData } from "@/entities";
import { createClient } from '@/utils/supabase/client';

// Unified Zod schema matching registration and DB
const clientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  birthday: z.string().optional(),
  gender: z.string().optional(),
  type_of_lesson: z.string().min(1, 'Lesson type is required'),
  additional_notes: z.string().optional(),
  status: z.enum(['pending', 'approved', 'enrolled', 'declined']).optional(),
  trainer_id: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ClientFormProps {
  client?: ClientData | null;
  onSubmit: (data: ClientFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ClientForm({ client, onSubmit, onCancel }: ClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loadingTrainers, setLoadingTrainers] = useState(true);
  const supabase = createClient();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      birthday: '',
      gender: '',
      type_of_lesson: '',
      additional_notes: '',
      status: 'pending',
      trainer_id: 'none',
    }
  });

  // Fetch trainers
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const { data, error } = await supabase
          .from('trainers')
          .select('id, first_name, last_name, email')
          .order('first_name');
        
        if (error) {
          console.error('Error fetching trainers:', error);
        } else {
          setTrainers(data || []);
        }
      } catch (error) {
        console.error('Error fetching trainers:', error);
      } finally {
        setLoadingTrainers(false);
      }
    };

    fetchTrainers();
  }, [supabase]);

  // Reset form when client changes
  useEffect(() => {
    if (client) {
      const trainerIdValue = (client as any).trainer_id;
      form.reset({
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        email: client.email || '',
        phone: client.phone || '',
        birthday: client.birthday || '',
        gender: client.gender || '',
        type_of_lesson: client.type_of_lesson || '',
        additional_notes: client.additional_notes || '',
        status: client.status || 'pending',
        trainer_id: trainerIdValue && trainerIdValue !== '' ? trainerIdValue : 'none',
      });
    } else {
      form.reset();
    }
  }, [client, form]);

  const handleSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      // Convert "none" trainer selection to undefined for database
      const submitData: ClientFormData = {
        ...data,
        trainer_id: data.trainer_id === 'none' ? undefined : data.trainer_id
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {client ? 'Edit Client' : 'Add New Client'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Student Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <User className="w-5 h-5" />
                Student Information
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="first_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="last_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <PhoneInput
                        placeholder="Enter phone number"
                        value={field.value}
                        onChange={field.onChange}
                        defaultCountry="SG"
                        className="phone-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="birthday" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birthday</FormLabel>
                    <FormControl>
                      <Input type="date" placeholder="Birthday" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Lesson Preferences */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Calendar className="w-5 h-5" />
                Lesson Preferences
              </div>
              
              <FormField control={form.control} name="type_of_lesson" render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Lesson *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select lesson type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="personal-training">Personal Training</SelectItem>
                      <SelectItem value="group-fitness">Group Fitness</SelectItem>
                      <SelectItem value="strength-training">Strength Training</SelectItem>
                      <SelectItem value="cardio-training">Cardio Training</SelectItem>
                      <SelectItem value="weight-loss">Weight Loss Program</SelectItem>
                      <SelectItem value="muscle-building">Muscle Building</SelectItem>
                      <SelectItem value="functional-fitness">Functional Fitness</SelectItem>
                      <SelectItem value="sports-conditioning">Sports Conditioning</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <FileText className="w-5 h-5" />
                Additional Information
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="trainer_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Trainer</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingTrainers ? "Loading..." : "Select a trainer"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No trainer assigned</SelectItem>
                        {trainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id}>
                            {trainer.first_name} {trainer.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="enrolled">Enrolled</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              
              <FormField control={form.control} name="additional_notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any special requests, concerns, or additional information" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {client ? 'Update Client' : 'Add Client'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
