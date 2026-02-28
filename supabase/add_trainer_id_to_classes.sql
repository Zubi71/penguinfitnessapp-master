-- Simple migration: Add trainer_id column to classes table
-- This script doesn't depend on the instructors table existing

-- Step 1: Add a new trainer_id column to classes table
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL;

-- Step 2: Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_classes_trainer_id ON public.classes(trainer_id);

-- Step 3: Add comments to clarify the column usage
COMMENT ON COLUMN public.classes.trainer_id IS 'References trainers table - use this for new implementations';
COMMENT ON COLUMN public.classes.instructor_id IS 'Legacy column - kept for backward compatibility';

-- Step 4: Verify the new column and constraint were created
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
        RAISE NOTICE 'trainer_id column added successfully to classes table';
    ELSE
        RAISE WARNING 'trainer_id column was not created';
    END IF;
    
    -- Check if foreign key constraint exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%classes_trainer_id%' 
        AND table_name = 'classes'
    ) THEN
        RAISE NOTICE 'Foreign key constraint for trainer_id created successfully';
    ELSE
        RAISE WARNING 'Foreign key constraint for trainer_id may not have been created';
    END IF;
END $$;

-- Optional: If you want to manually set trainer_id for existing classes
-- You can run this after creating trainer records:
-- UPDATE public.classes SET trainer_id = 'your-trainer-uuid' WHERE id = 'class-uuid';
