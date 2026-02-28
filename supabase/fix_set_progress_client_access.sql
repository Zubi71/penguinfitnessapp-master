-- Fix client access to set_progress table for saving weight and reps

-- Enable RLS on set_progress table if not already enabled
ALTER TABLE set_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Trainers can manage set progress" ON set_progress;
DROP POLICY IF EXISTS "Clients can manage their own set progress" ON set_progress;

-- Create policy for trainers to manage set progress
CREATE POLICY "Trainers can manage set progress" ON set_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = set_progress.client_id 
      AND clients.trainer_id = auth.uid()
    )
  );

-- Create policy for clients to manage their own set progress
CREATE POLICY "Clients can manage their own set progress" ON set_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = set_progress.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_set_progress_client_id ON set_progress(client_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_exercise_id ON set_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_training_day_id ON set_progress(training_day_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_exercise_client_set ON set_progress(exercise_id, training_day_id, client_id, set_number);
