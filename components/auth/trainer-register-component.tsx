"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, User, Mail, Phone, Shield } from "lucide-react";
import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'

export default function TrainerRegisterComponent() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    termsAccepted: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhoneChange = (value: string | undefined) => {
    setForm(prev => ({ ...prev, phone: value || "" }));
  };

  const validateForm = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError("Please fill in all required fields.");
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

    if (!form.phone) {
      setError("Phone number is required.");
      return false;
    }

    if (!form.termsAccepted) {
      setError("You must accept the terms and conditions.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register-trainer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setSuccess("Trainer registration successful! You can now log in with your credentials.");
      
      // Clear form
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        termsAccepted: false,
      });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Trainer Registration
          </CardTitle>
          <p className="text-gray-600">
            Join our team as a professional trainer
          </p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
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
            </div>

            {/* Account Security */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Shield size={20} />
                Account Security
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
            </div>

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="termsAccepted"
                  name="termsAccepted"
                  checked={form.termsAccepted}
                  onCheckedChange={(checked) => 
                    setForm(prev => ({ ...prev, termsAccepted: checked as boolean }))
                  }
                />
                <Label htmlFor="termsAccepted" className="text-sm">
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-600 hover:underline">
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Trainer Account"
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/login")}
                className="flex-1 sm:flex-none"
              >
                Back to Login
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
