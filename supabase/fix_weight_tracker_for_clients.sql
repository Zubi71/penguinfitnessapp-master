-- Fix body_weight_tracker table to allow client-only entries
-- Make trainer_id nullable
ALTER TABLE body_weight_tracker ALTER COLUMN trainer_id DROP NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Trainers can manage their clients' body weight data" ON body_weight_tracker;

-- Create new RLS policies that allow both trainers and clients to access their data
CREATE POLICY "Trainers can manage their clients' body weight data" ON body_weight_tracker
  FOR ALL USING (
    auth.uid() = trainer_id OR
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = body_weight_tracker.client_id 
      AND clients.email = auth.jwt() ->> 'email'
    )
  );

-- Create policy for clients to manage their own weight data
CREATE POLICY "Clients can manage their own weight data" ON body_weight_tracker
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = body_weight_tracker.client_id 
      AND clients.email = auth.jwt() ->> 'email'
    )
  );

-- Add comment to explain the structure
COMMENT ON TABLE body_weight_tracker IS 'Body weight tracking for clients. trainer_id can be null for client-only entries.';
