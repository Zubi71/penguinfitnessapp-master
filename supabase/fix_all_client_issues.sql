-- Comprehensive fix for all client access issues

-- 1. Add YouTube video URL to exercises table
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS youtube_video_url TEXT;
COMMENT ON COLUMN exercises.youtube_video_url IS 'YouTube video URL for exercise demonstration or instruction';

-- 2. Add user_id field to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- 3. Update existing clients to have user_id based on email match
UPDATE clients 
SET user_id = auth.users.id 
FROM auth.users 
WHERE clients.email = auth.users.email 
AND clients.user_id IS NULL;

-- 4. Fix set_progress table structure - change trainer_id to reference auth.users instead of trainers table
-- First, drop the existing foreign key constraint
ALTER TABLE set_progress DROP CONSTRAINT IF EXISTS set_progress_trainer_id_fkey;

-- Add new column for trainer user_id
ALTER TABLE set_progress ADD COLUMN IF NOT EXISTS trainer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing records to set trainer_user_id based on trainer_id
UPDATE set_progress 
SET trainer_user_id = trainers.user_id 
FROM trainers 
WHERE set_progress.trainer_id = trainers.id 
AND set_progress.trainer_user_id IS NULL;

-- Drop the old trainer_id column
ALTER TABLE set_progress DROP COLUMN IF EXISTS trainer_id;

-- Rename the new column to trainer_id for consistency
ALTER TABLE set_progress RENAME COLUMN trainer_user_id TO trainer_id;

-- 5. Drop existing RLS policies
DROP POLICY IF EXISTS "Trainers can view their client's set progress" ON set_progress;
DROP POLICY IF EXISTS "Trainers can insert their client's set progress" ON set_progress;
DROP POLICY IF EXISTS "Trainers can update their client's set progress" ON set_progress;
DROP POLICY IF EXISTS "Trainers can delete their client's set progress" ON set_progress;
DROP POLICY IF EXISTS "Clients can view their own set progress" ON set_progress;
DROP POLICY IF EXISTS "Trainers can manage set progress" ON set_progress;
DROP POLICY IF EXISTS "Clients can manage their own set progress" ON set_progress;

-- 6. Create new RLS policies for set_progress
-- Trainers can manage set progress for their clients
CREATE POLICY "Trainers can manage set progress" ON set_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = set_progress.client_id 
      AND clients.trainer_id = auth.uid()
    )
  );

-- Clients can manage their own set progress
CREATE POLICY "Clients can manage their own set progress" ON set_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = set_progress.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- 7. Drop existing client access policies
DROP POLICY IF EXISTS "Clients can view their assigned programs" ON training_programs;
DROP POLICY IF EXISTS "Clients can view training days for their programs" ON training_days;
DROP POLICY IF EXISTS "Clients can view exercises for their training days" ON exercises;
DROP POLICY IF EXISTS "Clients can view their own training programs" ON training_programs;

-- 8. Create new RLS policies for client access to training data
-- Clients can view their assigned training programs
CREATE POLICY "Clients can view their assigned programs" ON training_programs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = training_programs.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Clients can view training days for their programs
CREATE POLICY "Clients can view training days for their programs" ON training_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM training_programs 
      JOIN clients ON clients.id = training_programs.client_id
      WHERE training_programs.id = training_days.cycle_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Clients can view exercises for their training days
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

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_set_progress_client_id ON set_progress(client_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_exercise_id ON set_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_training_day_id ON set_progress(training_day_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_exercise_client_set ON set_progress(exercise_id, training_day_id, client_id, set_number);

-- 10. Add comments
COMMENT ON COLUMN clients.user_id IS 'References auth.users(id) to link client records to user accounts';
COMMENT ON COLUMN set_progress.trainer_id IS 'References auth.users(id) for the trainer who manages this client';
