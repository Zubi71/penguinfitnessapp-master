-- Fix RLS policies for exercises to ensure clients can access YouTube video URLs

-- First, let's check what policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'exercises';

-- Drop existing client access policies on exercises
DROP POLICY IF EXISTS "Clients can view exercises for their training days" ON exercises;
DROP POLICY IF EXISTS "Clients can view exercises" ON exercises;

-- Create a more permissive policy for clients to view exercises
CREATE POLICY "Clients can view exercises for their training days" ON exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM training_days 
      JOIN training_programs ON training_programs.id = training_days.cycle_id
      JOIN clients ON clients.id = training_programs.client_id
      WHERE training_days.id = exercises.training_day_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Also create a policy for trainers to manage exercises
CREATE POLICY "Trainers can manage exercises for their clients" ON exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM training_days 
      JOIN training_programs ON training_programs.id = training_days.cycle_id
      JOIN clients ON clients.id = training_programs.client_id
      WHERE training_days.id = exercises.training_day_id 
      AND clients.trainer_id = auth.uid()
    )
  );

-- Enable RLS on exercises if not already enabled
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON POLICY "Clients can view exercises for their training days" ON exercises IS 'Allows clients to view exercises including YouTube video URLs for their assigned training days';
