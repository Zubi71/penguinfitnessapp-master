"use client"
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Instructor, type InstructorData } from "@/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

import InstructorList from "@/components/instructors/InstructorList";
import InstructorForm from "@/components/instructors/InstructorForm";
import InstructorStats from "@/components/instructors/InstructorStats";

function InstructorsContent() {
  const [instructors, setInstructors] = useState<InstructorData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<InstructorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    loadInstructors();
    // Check URL parameters for new instructor action
    if (searchParams.get('action') === 'new') {
      setShowForm(true);
    }
  }, [searchParams]);

  const loadInstructors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/instructors');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const instructorsData = await response.json();
      setInstructors(instructorsData);
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (instructorData: Partial<InstructorData>) => {
    try {
      if (editingInstructor && editingInstructor.id) {
        // Update existing instructor
        const response = await fetch(`/api/instructors/${editingInstructor.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(instructorData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
      } else {
        // Create new instructor
        const response = await fetch('/api/instructors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(instructorData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
      }
      
      setShowForm(false);
      setEditingInstructor(null);
      loadInstructors();
    } catch (error) {
      console.error('Error saving instructor:', error);
      // Show user-friendly error message
      alert(`Failed to save instructor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (instructor: InstructorData) => {
    setEditingInstructor(instructor);
    setShowForm(true);
  };

  const handleDelete = async (instructorId: string) => {
    if (window.confirm('Are you sure you want to delete this instructor? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/instructors/${instructorId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        loadInstructors();
      } catch (error) {
        console.error('Error deleting instructor:', error);
        alert(`Failed to delete instructor: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const filteredInstructors = instructors.filter(instructor => {
    const matchesSearch = 
      instructor.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Instructors</h1>
            <p className="text-slate-600 mt-1">Manage your swimming instructors and their schedules</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200"
              />
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Instructor
            </Button>
          </div>
        </div>

        {/* Instructor Form Modal */}
        {showForm && (
          <InstructorForm
            instructor={editingInstructor}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingInstructor(null);
            }}
          />
        )}

        {/* Instructor Stats */}
        <InstructorStats instructors={instructors} isLoading={isLoading} />

        {/* Instructor List */}
        <InstructorList 
          instructors={filteredInstructors}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

export default function Instructors() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Instructors</h1>
              <p className="text-slate-600 mt-1">Manage your swimming instructors and their schedules</p>
            </div>
          </div>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    }>
      <InstructorsContent />
    </Suspense>
  );
}
