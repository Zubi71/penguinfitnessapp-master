"use client"
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { type ClassData } from "@/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

import ClassList from "@/components/class/classList";
import ClassForm from "@/components/class/ClassForm";
import ClassStats from "@/components/class/ClassStats";

function ClassesContent() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    // Check URL parameters for actions
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    
    if (action === 'new') {
      setShowForm(true);
      setEditingClass(null);
    } else if (action === 'edit' && id) {
      // Find the class to edit
      const classToEdit = classes.find(cls => cls.id.toString() === id);
      if (classToEdit) {
        setEditingClass(classToEdit);
        setShowForm(true);
      }
    }
  }, [searchParams, classes]);

  const loadClasses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/classes');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const classesData = await response.json();
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (classData: Partial<ClassData>) => {
    try {
      if (editingClass) {
        // Update existing class
        const response = await fetch(`/api/classes/${editingClass.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(classData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        // Close form and refresh
        handleCloseForm();
        loadClasses();
      } else {
        // Create new class
        const response = await fetch('/api/classes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(classData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const newClass = await response.json();
        
        // Show success message and option to add students
        const shouldAddStudents = window.confirm(
          'Class created successfully! Would you like to add students to this class now?'
        );
        
        if (shouldAddStudents) {
          // Refresh classes and open edit form
          await loadClasses();
          setEditingClass(newClass);
          // Keep form open for adding students
        } else {
          // Close form and refresh
          handleCloseForm();
          loadClasses();
        }
      }
    } catch (error) {
      console.error('Error saving class:', error);
      alert(`Failed to save class: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingClass(null);
    // Clear URL parameters
    router.push('/dashboard/classes');
  };

  const handleEdit = (classData: ClassData) => {
    setEditingClass(classData);
    setShowForm(true);
  };

  const handleDelete = async (classId: string) => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/classes/${classId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        loadClasses();
      } catch (error) {
        console.error('Error deleting class:', error);
        alert(`Failed to delete class: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const filteredClasses = classes.filter(classData => {
    const matchesSearch = 
      classData.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classData.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Classes</h1>
            <p className="text-slate-600 mt-1">Manage your swimming classes and schedules</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200"
              />
            </div>
            <Button
              onClick={() => {
                setEditingClass(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Class
            </Button>
          </div>
        </div>

        {/* Class Form Modal */}
        {showForm && (
          <ClassForm
            classData={editingClass}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
          />
        )}

        {/* Class Stats */}
        <ClassStats classes={classes} isLoading={isLoading} />

        {/* Class List */}
        <ClassList 
          classes={filteredClasses}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

export default function Classes() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Classes</h1>
              <p className="text-slate-600 mt-1">Manage your swimming classes and schedules</p>
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
      <ClassesContent />
    </Suspense>
  );
}
