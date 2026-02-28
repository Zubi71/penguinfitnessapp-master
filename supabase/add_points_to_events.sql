-- Add points_reward column to community_events table
ALTER TABLE community_events 
ADD COLUMN IF NOT EXISTS points_reward INTEGER DEFAULT 100;

-- Update existing events with points based on price
UPDATE community_events 
SET points_reward = CASE 
  WHEN price = 0 THEN 50  -- Free events give 50 points
  WHEN price <= 25 THEN 100  -- Events $25 or less give 100 points
  WHEN price <= 50 THEN 200  -- Events $26-50 give 200 points
  ELSE 300  -- Events over $50 give 300 points
END
WHERE points_reward IS NULL;
