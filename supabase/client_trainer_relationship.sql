-- Create a many-to-many relationship between clients and trainers
-- This allows one client to have multiple trainers and vice versa

-- Step 1: Create the junction table for client-trainer relationships
CREATE TABLE IF NOT EXISTS client_trainer_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_primary BOOLEAN DEFAULT false, -- Indicates if this is the primary trainer
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  notes TEXT, -- Optional notes about the relationship
  UNIQUE(client_id, trainer_id) -- Prevent duplicate relationships
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_trainer_client_id ON client_trainer_relationships(client_id);
CREATE INDEX IF NOT EXISTS idx_client_trainer_trainer_id ON client_trainer_relationships(trainer_id);
CREATE INDEX IF NOT EXISTS idx_client_trainer_status ON client_trainer_relationships(status);
CREATE INDEX IF NOT EXISTS idx_client_trainer_primary ON client_trainer_relationships(is_primary);

-- Step 3: Enable Row Level Security
ALTER TABLE client_trainer_relationships ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Trainers can view their client relationships" ON client_trainer_relationships
  FOR SELECT USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert their client relationships" ON client_trainer_relationships
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their client relationships" ON client_trainer_relationships
  FOR UPDATE USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete their client relationships" ON client_trainer_relationships
  FOR DELETE USING (auth.uid() = trainer_id);

-- Step 5: Add comment
COMMENT ON TABLE client_trainer_relationships IS 'Many-to-many relationship between clients and trainers';

-- Step 6: Migration: Move existing trainer_id from clients table to the new relationship table
-- This preserves existing relationships while setting up the new structure
INSERT INTO client_trainer_relationships (client_id, trainer_id, is_primary, status)
SELECT 
  id as client_id,
  trainer_id,
  true as is_primary, -- Make existing trainer the primary trainer
  'active' as status
FROM clients 
WHERE trainer_id IS NOT NULL
ON CONFLICT (client_id, trainer_id) DO NOTHING;

-- Step 7: Verification
DO $$
BEGIN
    -- Check if table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'client_trainer_relationships' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'SUCCESS: client_trainer_relationships table created';
    ELSE
        RAISE WARNING 'ISSUE: client_trainer_relationships table was not created';
    END IF;
    
    -- Check if indexes exist
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'client_trainer_relationships' 
        AND indexname LIKE '%client_id%'
    ) THEN
        RAISE NOTICE 'SUCCESS: client_trainer_relationships indexes created';
    ELSE
        RAISE WARNING 'ISSUE: client_trainer_relationships indexes may not have been created';
    END IF;
    
    -- Check migration count
    RAISE NOTICE 'Migration completed: % existing client-trainer relationships migrated', 
        (SELECT COUNT(*) FROM client_trainer_relationships);
END $$; 