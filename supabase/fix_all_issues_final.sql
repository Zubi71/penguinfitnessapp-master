-- Final comprehensive fix for all client access issues

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

-- 4. Ensure all clients have user_roles entries
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT c.user_id, 'client'::app_role
FROM clients c
WHERE c.user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = c.user_id AND ur.role = 'client'
);

-- 5. Fix set_progress table structure - change trainer_id to reference auth.users instead of trainers table
-- First, drop the existing foreign key constraint if it exists
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

-- 6. Drop existing RLS policies
DROP POLICY IF EXISTS "Trainers can view their client's set progress" ON set_progress;
DROP POLICY IF EXISTS "Trainers can insert their client's set progress" ON set_progress;
DROP POLICY IF EXISTS "Trainers can update their client's set progress" ON set_progress;
DROP POLICY IF EXISTS "Trainers can delete their client's set progress" ON set_progress;
DROP POLICY IF EXISTS "Clients can view their own set progress" ON set_progress;
DROP POLICY IF EXISTS "Trainers can manage set progress" ON set_progress;
DROP POLICY IF EXISTS "Clients can manage their own set progress" ON set_progress;

-- 7. Create new RLS policies for set_progress
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

-- 8. Drop existing client access policies
DROP POLICY IF EXISTS "Clients can view their assigned programs" ON training_programs;
DROP POLICY IF EXISTS "Clients can view training days for their programs" ON training_days;
DROP POLICY IF EXISTS "Clients can view exercises for their training days" ON exercises;
DROP POLICY IF EXISTS "Clients can view their own training programs" ON training_programs;

-- 9. Create new RLS policies for client access to training data
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

-- 10. Create RLS policies for clients table access
-- Drop existing policies on clients table
DROP POLICY IF EXISTS "Clients can view their own data" ON clients;
DROP POLICY IF EXISTS "Trainers can view their clients" ON clients;
DROP POLICY IF EXISTS "Clients can view own client record" ON clients;

-- Create new policies for clients table
-- Clients can view their own client record
CREATE POLICY "Clients can view own client record" ON clients
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Trainers can view their clients
CREATE POLICY "Trainers can view their clients" ON clients
  FOR SELECT USING (
    trainer_id = auth.uid()
  );

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_set_progress_client_id ON set_progress(client_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_exercise_id ON set_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_training_day_id ON set_progress(training_day_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_exercise_client_set ON set_progress(exercise_id, training_day_id, client_id, set_number);

-- 12. Add comments
COMMENT ON COLUMN clients.user_id IS 'References auth.users(id) to link client records to user accounts';
COMMENT ON COLUMN set_progress.trainer_id IS 'References auth.users(id) for the trainer who manages this client';

-- 13. Enable RLS on set_progress if not already enabled
ALTER TABLE set_progress ENABLE ROW LEVEL SECURITY;

-- 14. Create a function to help with debugging
CREATE OR REPLACE FUNCTION debug_client_access(client_uuid UUID)
RETURNS TABLE (
  client_id UUID,
  client_email TEXT,
  client_user_id UUID,
  client_trainer_id UUID,
  has_user_role BOOLEAN,
  user_role TEXT,
  auth_user_exists BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as client_id,
    c.email as client_email,
    c.user_id as client_user_id,
    c.trainer_id as client_trainer_id,
    CASE WHEN ur.user_id IS NOT NULL THEN true ELSE false END as has_user_role,
    ur.role as user_role,
    CASE WHEN au.id IS NOT NULL THEN true ELSE false END as auth_user_exists
  FROM clients c
  LEFT JOIN user_roles ur ON c.user_id = ur.user_id
  LEFT JOIN auth.users au ON c.user_id = au.id
  WHERE c.id = client_uuid;
END;
$$ LANGUAGE plpgsql;

-- 15. Create a function to get client by email (for debugging) - Fixed parameter name conflict
CREATE OR REPLACE FUNCTION get_client_by_email(search_email TEXT)
RETURNS TABLE (
  client_id UUID,
  client_email TEXT,
  client_user_id UUID,
  client_trainer_id UUID,
  has_user_role BOOLEAN,
  user_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as client_id,
    c.email as client_email,
    c.user_id as client_user_id,
    c.trainer_id as client_trainer_id,
    CASE WHEN ur.user_id IS NOT NULL THEN true ELSE false END as has_user_role,
    ur.role as user_role
  FROM clients c
  LEFT JOIN user_roles ur ON c.user_id = ur.user_id
  WHERE c.email = search_email;
END;
$$ LANGUAGE plpgsql;
