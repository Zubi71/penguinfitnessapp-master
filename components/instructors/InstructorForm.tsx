"use client"
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Save, User, Phone, Mail } from "lucide-react";
import type { InstructorData } from "@/entities";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface InstructorFormProps {
  instructor?: InstructorData | null;
  onSubmit: (data: Partial<InstructorData>) => void;
  onCancel: () => void;
}

export default function InstructorForm({ instructor, onSubmit, onCancel }: InstructorFormProps) {
  const [formData, setFormData] = useState({
    first_name: instructor?.first_name || "",
    last_name: instructor?.last_name || "",
    email: instructor?.email || "",
    phone: instructor?.phone || "",
    hire_date: instructor?.hire_date || new Date().toISOString().split('T')[0]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handlePhoneChange = (value: string | undefined) => {
    setFormData(prev => ({ ...prev, phone: value || "" }));
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: "" }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            {instructor ? "Edit Trainer" : "Add New Trainer"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                  />
                  {errors.first_name && <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>}
                </div>
                
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                  />
                  {errors.last_name && <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Phone className="h-5 w-5" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>
                
                <div>
                  <Label>
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone Number
                  </Label>
                  <PhoneInput
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    defaultCountry="SG"
                    className="phone-input"
                  />
                  {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5" />
                Employment Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hire_date">Hire Date</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => handleInputChange("hire_date", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                {instructor ? "Update Trainer" : "Add Trainer"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
