-- Fix the relationship between classes and instructors tables
-- This addresses the foreign key relationship error in Supabase

-- First, check if the foreign key constraint exists and drop it if it does
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'classes_instructor_id_fkey' 
        AND table_name = 'classes'
    ) THEN
        ALTER TABLE public.classes DROP CONSTRAINT classes_instructor_id_fkey;
    END IF;
END $$;

-- Recreate the foreign key constraint properly
ALTER TABLE public.classes 
ADD CONSTRAINT classes_instructor_id_fkey 
FOREIGN KEY (instructor_id) 
REFERENCES public.instructors(id) 
ON DELETE SET NULL;

-- Refresh the schema cache by updating table comments
COMMENT ON TABLE public.classes IS 'Classes table with proper instructor relationship - updated ' || NOW();
COMMENT ON TABLE public.instructors IS 'Instructors table - updated ' || NOW();

-- Create an index on the foreign key if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_classes_instructor_id ON public.classes(instructor_id);

-- Verify the constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'classes_instructor_id_fkey' 
        AND table_name = 'classes'
    ) THEN
        RAISE EXCEPTION 'Foreign key constraint was not created successfully';
    END IF;
    
    RAISE NOTICE 'Foreign key constraint classes_instructor_id_fkey created successfully';
END $$;
