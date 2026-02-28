-- Remove instructor references and use only trainers
-- This script removes all instructor dependencies and uses only trainers

-- Step 1: Add trainer_id column if it doesn't exist
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL;

-- Step 2: Create index for trainer_id
CREATE INDEX IF NOT EXISTS idx_classes_trainer_id ON public.classes(trainer_id);

-- Step 3: Remove instructor_id column (if you want to completely remove it)
-- WARNING: This will delete any data in instructor_id column
-- Comment out this line if you want to keep the column for now
-- ALTER TABLE public.classes DROP COLUMN IF EXISTS instructor_id;

-- Step 4: Remove instructor_id index if it exists
DROP INDEX IF EXISTS idx_classes_instructor_id;

-- Step 5: Update any existing data to use trainer_id instead of instructor_id
-- This is a placeholder - you'll need to manually set trainer_id values
-- UPDATE public.classes SET trainer_id = 'your-trainer-uuid' WHERE trainer_id IS NULL;

-- Step 6: Add comments
COMMENT ON COLUMN public.classes.trainer_id IS 'References trainers table - primary trainer assignment';
COMMENT ON COLUMN public.classes.instructor_id IS 'DEPRECATED - use trainer_id instead';

-- Verification
DO $$
BEGIN
    -- Check if trainer_id column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'classes' 
        AND column_name = 'trainer_id'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'SUCCESS: trainer_id column exists in classes table';
    ELSE
        RAISE WARNING 'ISSUE: trainer_id column does not exist in classes table';
    END IF;
    
    -- Check if trainer_id index exists
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'classes' 
        AND indexname LIKE '%trainer_id%'
    ) THEN
        RAISE NOTICE 'SUCCESS: trainer_id index exists';
    ELSE
        RAISE WARNING 'ISSUE: trainer_id index may not exist';
    END IF;
    
    -- Check if instructor_id index was removed
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'classes' 
        AND indexname LIKE '%instructor_id%'
    ) THEN
        RAISE NOTICE 'SUCCESS: instructor_id index removed';
    ELSE
        RAISE NOTICE 'INFO: instructor_id index still exists';
    END IF;
END $$;
