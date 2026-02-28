-- Alternative fix: Update the classes table to use trainers instead of instructors
-- This aligns with your current schema direction

-- Step 1: Add a new trainer_id column
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL;

-- Step 2: Copy data from instructor_id to trainer_id if trainers exist with same email as instructors
-- Check if instructors table exists first
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'instructors' AND table_schema = 'public') THEN
        -- Instructors table exists, migrate data
        UPDATE public.classes 
        SET trainer_id = (
          SELECT t.id 
          FROM public.trainers t 
          JOIN public.instructors i ON i.email = t.email 
          WHERE i.id = public.classes.instructor_id
        )
        WHERE instructor_id IS NOT NULL;
        RAISE NOTICE 'Migrated data from instructors to trainers table';
    ELSE
        RAISE NOTICE 'Instructors table does not exist, skipping data migration';
    END IF;
END $$;

-- Step 3: Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_classes_trainer_id ON public.classes(trainer_id);

-- Step 4: Update the dashboard API to use trainer_id instead of instructor_id
-- (This would be done in the application code)

COMMENT ON COLUMN public.classes.trainer_id IS 'References trainers table - preferred over instructor_id';
COMMENT ON COLUMN public.classes.instructor_id IS 'Legacy column - use trainer_id instead';

-- Verify the new constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%classes_trainer_id%' 
        AND table_name = 'classes'
    ) THEN
        RAISE NOTICE 'New trainer_id foreign key constraint created successfully';
    ELSE
        RAISE WARNING 'trainer_id foreign key constraint may not have been created';
    END IF;
END $$;
