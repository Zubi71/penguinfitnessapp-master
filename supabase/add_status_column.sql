-- Add status column to training_programs table
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add constraint for status values
ALTER TABLE training_programs DROP CONSTRAINT IF EXISTS training_programs_status_check;
ALTER TABLE training_programs ADD CONSTRAINT training_programs_status_check CHECK (status IN ('active', 'completed', 'paused'));

-- Update existing records to have 'active' status
UPDATE training_programs SET status = 'active' WHERE status IS NULL;
