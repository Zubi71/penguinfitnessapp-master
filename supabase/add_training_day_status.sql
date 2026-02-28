-- Add status completion fields to existing training_days table

-- Add status and completed_at columns if they don't exist
ALTER TABLE training_days 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed'));

ALTER TABLE training_days 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update existing records to have pending status
UPDATE training_days 
SET status = 'pending' 
WHERE status IS NULL;
