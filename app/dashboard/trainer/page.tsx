"use client"
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Trainer, type TrainerData } from "@/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

import TrainerList from "@/components/trainers/TrainerList";
import TrainerForm from "@/components/trainers/TrainerForm";
import TrainerStats from "@/components/trainers/TrainerStats";

function TrainersContent() {
  const [trainers, setTrainers] = useState<TrainerData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<TrainerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    loadTrainers();
    // Check URL parameters for new trainer action
    if (searchParams.get('action') === 'new') {
      setShowForm(true);
    }
  }, [searchParams]);

  const loadTrainers = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Fetching trainers from API...');
      const response = await fetch('/api/trainers');
      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const trainersData = await response.json();
      console.log('📋 Trainers data received:', trainersData);
      console.log('🔢 Number of trainers:', trainersData?.length || 0);
      
      setTrainers(trainersData);
    } catch (error) {
      console.error('Error loading trainers:', error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (trainerData: Partial<TrainerData>) => {
    try {
      if (editingTrainer && editingTrainer.id) {
        // Update existing trainer
        const response = await fetch(`/api/trainers/${editingTrainer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trainerData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
      } else {
        // Create new trainer
        const response = await fetch('/api/trainers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trainerData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
      }
      
      setShowForm(false);
      setEditingTrainer(null);
      loadTrainers();
    } catch (error) {
      console.error('Error saving trainer:', error);
      // Show user-friendly error message
      alert(`Failed to save trainer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (trainer: TrainerData) => {
    setEditingTrainer(trainer);
    setShowForm(true);
  };

  const handleSetupRelationships = async () => {
    try {
      console.log('🛠️ Setting up client-trainer relationships...')
      const response = await fetch('/api/debug/setup-relationships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        alert(`Failed to setup relationships: ${result.error}`)
        return
      }

      alert(`✅ Setup completed! ${result.relationshipsCount} relationships created.`)
    } catch (error) {
      console.error('Error setting up relationships:', error)
      alert('Failed to setup relationships. Please try again.')
    }
  }

  const handleDelete = async (trainerId: string) => {
    if (window.confirm('Are you sure you want to delete this trainer? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/trainers/${trainerId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        loadTrainers();
      } catch (error) {
        console.error('Error deleting trainer:', error);
        alert(`Failed to delete trainer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = 
      trainer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trainer.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Trainers</h1>
            <p className="text-slate-600 mt-1">Manage your Trainers and their schedules</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search trainers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200"
              />
            </div>
            <Button
              onClick={handleSetupRelationships}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
            >
              Setup Relationships
            </Button>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Trainer
            </Button>
          </div>
        </div>

        {/* Trainer Form Modal */}
        {showForm && (
          <TrainerForm
            trainer={editingTrainer}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingTrainer(null);
            }}
          />
        )}

        {/* Trainer Stats */}
        <TrainerStats trainers={trainers} isLoading={isLoading} />

        {/* Trainer List */}
        <TrainerList 
          trainers={filteredTrainers}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

export default function Trainers() {
  return (
    <Suspense fallback={
      <div className="p-6 space-y-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Trainers</h1>
              <p className="text-slate-600 mt-1">Manage your Trainers and their schedules</p>
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
      <TrainersContent />
    </Suspense>
  );
}
