-- Add trainer assignment to client_signups table
-- This allows assigning trainers to clients

-- Step 1: Add trainer_id column to client_signups table
ALTER TABLE public.client_signups 
ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL;

-- Step 2: Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_client_signups_trainer_id ON public.client_signups(trainer_id);

-- Step 3: Add comment
COMMENT ON COLUMN public.client_signups.trainer_id IS 'Assigned trainer for this client';

-- Verification
DO $$
BEGIN
    -- Check if trainer_id column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'client_signups' 
        AND column_name = 'trainer_id'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'SUCCESS: trainer_id column added to client_signups table';
    ELSE
        RAISE WARNING 'ISSUE: trainer_id column was not added to client_signups table';
    END IF;
    
    -- Check if index exists
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'client_signups' 
        AND indexname LIKE '%trainer_id%'
    ) THEN
        RAISE NOTICE 'SUCCESS: trainer_id index created';
    ELSE
        RAISE WARNING 'ISSUE: trainer_id index may not have been created';
    END IF;
END $$;
