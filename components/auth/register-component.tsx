"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'

export default function RegisterComponent() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    birthdayMonth: "",
    birthdayDate: "",
    birthdayYear: "",
    gender: "",
    parentFirstName: "",
    parentLastName: "",
    parentRelationship: "",
    parentEmail: "",
    parentPhone: "",
    sameAsEmail: true,
    sameAsPhone: true,
    typeOfLesson: "",
    preferredDays: "",
    preferredStartTime: "",
    location: "",
    medicalConditions: "",
    medicalDetails: "",
    additionalNotes: "",
    termsAccepted: false,
  });
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => {
      const newForm = { ...prev, [name]: value };
      
      // Auto-update parent fields when primary fields change and "same as" is checked
      if (name === 'email' && prev.sameAsEmail) {
        newForm.parentEmail = value;
      }
      if (name === 'phone' && prev.sameAsPhone) {
        newForm.parentPhone = value;
      }
      
      return newForm;
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(prev => {
      const newForm = { ...prev, [name]: checked };
      
      // Auto-fill parent email/phone when "Same as primary" is checked
      if (name === 'sameAsEmail') {
        newForm.parentEmail = checked ? prev.email : '';
      }
      if (name === 'sameAsPhone') {
        newForm.parentPhone = checked ? prev.phone : '';
      }
      
      return newForm;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate terms and conditions
    if (!form.termsAccepted) {
      alert("Please accept the terms and conditions to continue.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Map camelCase form fields to snake_case for API
      const payload = {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone,
        birthday: form.birthdayYear && form.birthdayMonth && form.birthdayDate
          ? `${form.birthdayYear}-${String(form.birthdayMonth).padStart(2, '0')}-${String(form.birthdayDate).padStart(2, '0')}`
          : null,
        gender: form.gender,
        parent_first_name: form.parentFirstName,
        parent_last_name: form.parentLastName,
        parent_relationship: form.parentRelationship,
        parent_email: form.parentEmail,
        parent_phone: form.parentPhone,
        same_as_email: form.sameAsEmail,
        same_as_phone: form.sameAsPhone,
        type_of_lesson: form.typeOfLesson,
        preferred_days: form.preferredDays,
        preferred_start_time: form.preferredStartTime,
        location: form.location,
        medical_conditions: form.medicalConditions,
        medical_details: form.medicalDetails,
        additional_notes: form.additionalNotes,
      };
      const res = await fetch('/api/register-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        // Show success message
        alert(`🎉 Registration Successful!\n\n✅ Account created successfully\n📧 Welcome email sent to ${form.email}\n📱 WhatsApp notification sent to ${form.phone}\n\n🔑 Temporary Password: ${result.tempPassword}\n\nPlease save this password - you'll need it to login.\n\nRedirecting to login page...`);
        
        // Reset form
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          birthdayMonth: "",
          birthdayDate: "",
          birthdayYear: "",
          gender: "",
          parentFirstName: "",
          parentLastName: "",
          parentRelationship: "",
          parentEmail: "",
          parentPhone: "",
          sameAsEmail: false,
          sameAsPhone: false,
          typeOfLesson: "",
          preferredDays: "",
          preferredStartTime: "",
          location: "",
          medicalConditions: "",
          medicalDetails: "",
          additionalNotes: "",
          termsAccepted: false,
        });
        
        // Set redirecting state and redirect to login page
        setRedirecting(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000); // Wait 2 seconds so user can read the success message
      } else {
        alert(`Signup failed: ${result.error}`);
      }
    } catch (error) {
      alert("Signup failed: Network error");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 bg-white p-8 rounded-lg shadow-lg">
      {redirecting && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-3"></div>
            <span className="font-semibold">Registration Successful!</span>
          </div>
          <p className="mt-2 text-sm">
            Welcome emails and WhatsApp notifications have been sent. Redirecting to login page...
          </p>
        </div>
      )}
      
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2 text-blue-600">Student Official Registration Form</h2>
        <p className="text-gray-600">Welcome to our swimming program! Please complete this Student Official Registration Form to enrol in our swimming lessons. Providing accurate details ensures a smooth registration process and helps us tailor our lessons to your needs.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Information */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Student Information</h3>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block mb-1 font-medium">Student's First Name *</label>
              <input type="text" name="firstName" value={form.firstName} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-medium">Student's Last Name *</label>
              <input type="text" name="lastName" value={form.lastName} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-1 font-medium">Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
          </div>
          
          <div className="mb-4">
            <label className="block mb-1 font-medium">Phone *</label>
            <PhoneInput
              placeholder="Enter phone number"
              value={form.phone}
              onChange={(value) => setForm(prev => {
                const newForm = { ...prev, phone: value || "" };
                // Auto-update parent phone if "same as" is checked
                if (prev.sameAsPhone) {
                  newForm.parentPhone = value || "";
                }
                return newForm;
              })}
              defaultCountry="SG"
              required
              className="w-full"
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-1 font-medium">Student's Birthday *</label>
            <div className="flex gap-3">
              <select name="birthdayMonth" value={form.birthdayMonth} onChange={handleChange} required className="flex-1 border rounded px-3 py-2">
                <option value="">Month</option>
                {Array.from({length: 12}, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <select name="birthdayDate" value={form.birthdayDate} onChange={handleChange} required className="flex-1 border rounded px-3 py-2">
                <option value="">Date</option>
                {Array.from({length: 31}, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <select name="birthdayYear" value={form.birthdayYear} onChange={handleChange} required className="flex-1 border rounded px-3 py-2">
                <option value="">Year</option>
                {Array.from({length: 100}, (_, i) => (
                  <option key={2024 - i} value={2024 - i}>{2024 - i}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-1 font-medium">Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Parent Information */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Parent Information</h3>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <label className="block mb-1 font-medium">First Name</label>
              <input type="text" name="parentFirstName" value={form.parentFirstName} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex-1">
              <label className="block mb-1 font-medium">Last Name</label>
              <input type="text" name="parentLastName" value={form.parentLastName} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-1 font-medium">Relationship</label>
            <select name="parentRelationship" value={form.parentRelationship} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="">Select relationship</option>
              <option value="mother">Mother</option>
              <option value="father">Father</option>
              <option value="guardian">Guardian</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="flex items-center mt-2">
              <input 
                type="checkbox" 
                name="sameAsEmail" 
                checked={form.sameAsEmail} 
                onChange={handleCheckboxChange}
                className="mr-2" 
              />
              Same as primary email
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block mb-1 font-medium">Parent Email</label>
            <input 
              type="email" 
              name="parentEmail" 
              value={form.parentEmail} 
              onChange={handleChange}
              disabled={form.sameAsEmail}
              className="w-full border rounded px-3 py-2 disabled:bg-gray-100" 
            />
          </div>
          
          <div className="mb-4">
            <label className="flex items-center mt-2">
              <input 
                type="checkbox" 
                name="sameAsPhone" 
                checked={form.sameAsPhone} 
                onChange={handleCheckboxChange}
                className="mr-2" 
              />
              Same as primary number
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block mb-1 font-medium">Parent Phone</label>
            <PhoneInput
              placeholder="Enter parent phone number"
              value={form.parentPhone}
              onChange={(value) => setForm({ ...form, parentPhone: value || "" })}
              defaultCountry="SG"
              disabled={form.sameAsPhone}
              className="w-full"
            />
          </div>
        </div>

        {/* Lesson Preferences */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Lesson Preferences</h3>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Preferred Type of Lesson *</label>
            <select name="typeOfLesson" value={form.typeOfLesson} onChange={handleChange} required className="w-full border rounded px-3 py-2">
              <option value="">Select lesson type</option>
              <option value="private">Private 1-on-1</option>
              <option value="group-2">2 in a group</option>
              <option value="group-3">3 in a group</option>
              <option value="group-4-5">4-5 in a group</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block mb-1 font-medium">Preferred Day *</label>
            <input type="text" name="preferredDays" value={form.preferredDays} onChange={handleChange} required className="w-full border rounded px-3 py-2" placeholder="e.g. Monday, Wednesday" />
          </div>
          
          <div className="mb-4">
            <label className="block mb-1 font-medium">Preferred Start Time *</label>
            <input type="text" name="preferredStartTime" value={form.preferredStartTime} onChange={handleChange} required className="w-full border rounded px-3 py-2" placeholder="Please Specify eg. 10AM" />
          </div>
          
          <div className="mb-4">
            <label className="block mb-1 font-medium">Location *</label>
            <input type="text" name="location" value={form.location} onChange={handleChange} required className="w-full border rounded px-3 py-2" placeholder="Please specify condo name/Postal code for Private Pool or Public Pool name" />
          </div>
        </div>

        {/* Medical Information */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Medical Information</h3>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Does the student have any medical conditions or special needs? *</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center">
                <input type="radio" name="medicalConditions" value="yes" checked={form.medicalConditions === 'yes'} onChange={handleChange} className="mr-2" />
                Yes
              </label>
              <label className="flex items-center">
                <input type="radio" name="medicalConditions" value="no" checked={form.medicalConditions === 'no'} onChange={handleChange} className="mr-2" />
                No
              </label>
            </div>
          </div>
          
          {form.medicalConditions === 'yes' && (
            <div className="mb-4">
              <label className="block mb-1 font-medium">If you have mentioned yes, please specify</label>
              <textarea name="medicalDetails" value={form.medicalDetails} onChange={handleChange} rows={3} className="w-full border rounded px-3 py-2" />
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Additional Notes</h3>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Any special requests or concerns</label>
            <textarea name="additionalNotes" value={form.additionalNotes} onChange={handleChange} rows={4} className="w-full border rounded px-3 py-2" placeholder="Please share any additional information..." />
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={form.termsAccepted}
              onChange={(e) => setForm(prev => ({ ...prev, termsAccepted: e.target.checked }))}
              className="mr-2"
              required
            />
            <span className="text-sm">
              I agree to the{" "}
              <a href="/terms" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                terms and conditions
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                privacy policy
              </a>{" "}
              *
            </span>
          </label>
        </div>

        <button
          type="submit"
          className={`w-full py-3 rounded font-semibold transition text-lg ${
            loading || redirecting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
          disabled={loading || redirecting}
        >
          {redirecting 
            ? "✅ Success! Redirecting to Login..." 
            : loading 
            ? "🔄 Submitting Registration..." 
            : "Submit Registration"
          }
        </button>
      </form>
    </div>
  );
}
