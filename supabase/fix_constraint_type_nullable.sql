-- Quick fix: Make constraint_type nullable
-- Run this if you're getting "null value in column constraint_type violates not-null constraint"

ALTER TABLE public.trainer_availability 
  ALTER COLUMN constraint_type DROP NOT NULL;

-- Verify the change
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trainer_availability' 
    AND column_name = 'constraint_type'
    AND is_nullable = 'YES'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ Successfully made constraint_type nullable';
  ELSE
    RAISE WARNING '❌ constraint_type is still NOT NULL - check the migration';
  END IF;
END $$;

