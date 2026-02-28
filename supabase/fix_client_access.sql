-- Fix client access by adding user_id field and updating RLS policies

-- Add user_id field to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- Update existing clients to have user_id based on email match
-- This assumes that the email in clients table matches the email in auth.users
UPDATE clients 
SET user_id = auth.users.id 
FROM auth.users 
WHERE clients.email = auth.users.email 
AND clients.user_id IS NULL;

-- Drop existing client access policies if they exist
DROP POLICY IF EXISTS "Clients can view their assigned programs" ON training_programs;
DROP POLICY IF EXISTS "Clients can view training days for their programs" ON training_days;
DROP POLICY IF EXISTS "Clients can view exercises for their training days" ON exercises;
DROP POLICY IF EXISTS "Clients can view their own training programs" ON training_programs;

-- Create new RLS policies for clients
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

-- Add comment to explain the user_id field
COMMENT ON COLUMN clients.user_id IS 'References auth.users(id) to link client records to user accounts';
