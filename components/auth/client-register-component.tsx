"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, User, Mail, Phone, Calendar, Target } from "lucide-react";
import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'
import ServiceSelection from "@/components/pricing/ServiceSelection";
import { type ServicePackage } from "@/config/pricing";

export default function ClientRegisterComponent() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 2-step registration: 1=info, 2=contact/register
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    // Step 1: Basic Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthday: "",
    gender: "",
    // Step 2: Contact/Registration
    password: "",
    confirmPassword: "",
    // Additional preferences (optional)
    medicalConditions: "",
    additionalNotes: "",
  });
  
  // const [selectedService, setSelectedService] = useState<ServicePackage | null>(null);
  const [selectedService, setSelectedService] = useState<ServicePackage | null>(null);
  // Removed duplicate state declarations - using the ones above

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (value: string | undefined) => {
    setForm(prev => ({ ...prev, phone: value || "" }));
  };

  // const handleEmergencyPhoneChange = (value: string | undefined) => {
  //   setForm(prev => ({ ...prev, emergencyContactPhone: value || "" }));
  // };

  const validateStep1 = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      setError("Please fill in all required fields.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!form.password || !form.confirmPassword) {
      setError("Please fill in password fields.");
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }

    if (!selectedService) {
      setError("Please select a service package.");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    setError("");
    
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setError("");
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");

    // Validate current step
    if (step === 1) {
      if (validateStep1()) {
        handleNext();
      }
      return;
    }

    if (step === 2) {
      if (!validateStep2()) {
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          dateOfBirth: form.birthday,
          selectedService: selectedService || {
            id: 'basic',
            name: 'Basic Package',
            price: 0,
            description: 'Default starter package'
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setSuccess("Registration successful! Welcome to our fitness program. You will receive a confirmation email shortly.");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);

    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <User size={20} />
          Personal Information
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <PhoneInput
              value={form.phone}
              onChange={handlePhoneChange}
              defaultCountry="SG"
              className="phone-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="birthday">Date of Birth (Optional)</Label>
            <Input
              id="birthday"
              name="birthday"
              type="date"
              value={form.birthday}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="gender">Gender (Optional)</Label>
            <Select value={form.gender} onValueChange={(value) => setForm(prev => ({ ...prev, gender: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {/* Package Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Target size={20} />
          Choose Your Training Package
        </div>
        <p className="text-gray-600">
          Select the fitness service that best suits your goals
        </p>
        
        <ServiceSelection 
          onServiceSelect={setSelectedService}
          selectedService={selectedService}
        />
      </div>

      {/* Account Setup */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <User size={20} />
          Create Your Account
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="medicalConditions">Medical Conditions / Injuries (Optional)</Label>
          <Input
            id="medicalConditions"
            name="medicalConditions"
            value={form.medicalConditions}
            onChange={handleChange}
            placeholder="Please list any relevant medical conditions or injuries"
          />
        </div>

        <div>
          <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
          <textarea
            id="additionalNotes"
            name="additionalNotes"
            value={form.additionalNotes}
            onChange={handleChange}
            placeholder="Any additional information you'd like to share"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Start Your Fitness Journey
          </CardTitle>
          <p className="text-gray-600">
            {step === 1 ? 'Let us know about you' : 'Choose your package and create your account'}
          </p>
          
          {/* Step Indicator */}
          <div className="flex justify-center space-x-4 mt-4">
            {[1, 2].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNumber === step
                    ? 'bg-blue-600 text-white'
                    : stepNumber < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {stepNumber}
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-600">
            Step {step} of 2: {
              step === 1 ? 'Personal Information' : 'Package & Account Setup'
            }
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                >
                  Previous
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/login")}
                >
                  Back to Login
                </Button>
              )}
              
              {step < 2 ? (
                <Button type="submit" disabled={loading}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <button 
              onClick={() => router.push("/login")}
              className="text-blue-600 hover:underline"
            >
              Sign in here
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
