-- Complete database schema for training cycles system

-- First, ensure the training_programs table exists with correct structure
DROP TABLE IF EXISTS training_days CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;

-- Recreate training_programs table if needed
CREATE TABLE IF NOT EXISTS training_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create training_days table for storing individual days within a training cycle week
CREATE TABLE training_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  day_name TEXT NOT NULL,
  description TEXT,
  is_rest_day BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(cycle_id, week_number, day_number)
);

-- Create exercises table for storing individual exercises within a training day
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  training_day_id UUID REFERENCES training_days(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_order INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  sets INTEGER,
  reps TEXT, -- Can be numbers or ranges like "8-12"
  weight TEXT, -- Can include units like "60kg" or "bodyweight"
  rest_time TEXT, -- e.g., "60s", "2min"
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Trainers can manage their own programs" ON training_programs;
DROP POLICY IF EXISTS "Trainers can manage their own training days" ON training_days;
DROP POLICY IF EXISTS "Trainers can manage their own exercises" ON exercises;

-- Create RLS policies for training_programs
CREATE POLICY "Trainers can manage their own programs" ON training_programs
  FOR ALL USING (auth.uid() = trainer_id);

-- Create RLS policies for training_days
CREATE POLICY "Trainers can manage their own training days" ON training_days
  FOR ALL USING (auth.uid() = trainer_id);

-- Create RLS policies for exercises
CREATE POLICY "Trainers can manage their own exercises" ON exercises
  FOR ALL USING (auth.uid() = trainer_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_programs_trainer ON training_programs(trainer_id);
CREATE INDEX IF NOT EXISTS idx_training_programs_client ON training_programs(client_id);
CREATE INDEX IF NOT EXISTS idx_training_days_cycle_week ON training_days(cycle_id, week_number);
CREATE INDEX IF NOT EXISTS idx_exercises_training_day ON exercises(training_day_id);
CREATE INDEX IF NOT EXISTS idx_exercises_order ON exercises(training_day_id, exercise_order);

-- Remove duration_weeks column if it exists
ALTER TABLE training_programs DROP COLUMN IF EXISTS duration_weeks;
