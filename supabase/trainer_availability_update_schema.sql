-- Update Trainer Availability Schema to Support Time Ranges
-- Run this if you already have the trainer_availability table with constraint_type/constraint_time

-- Step 1: Make constraint_type nullable (since we're using start_time/end_time now)
ALTER TABLE public.trainer_availability 
  ALTER COLUMN constraint_type DROP NOT NULL;

-- Step 2: Add new columns for time ranges (if they don't exist)
ALTER TABLE public.trainer_availability 
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME;

-- Step 3: Migrate existing data from constraint_type/constraint_time to time ranges
-- Convert "free" constraint_type to NULL start_time and end_time (all day)
UPDATE public.trainer_availability 
SET start_time = NULL, end_time = NULL
WHERE constraint_type = 'free' AND (start_time IS NULL OR end_time IS NULL);

-- Convert "after" constraint_type to start_time only (available from that time onwards)
UPDATE public.trainer_availability 
SET start_time = constraint_time, end_time = NULL
WHERE constraint_type = 'after' AND constraint_time IS NOT NULL AND start_time IS NULL;

-- Convert "before" constraint_type to end_time only (available up to that time)
UPDATE public.trainer_availability 
SET start_time = NULL, end_time = constraint_time
WHERE constraint_type = 'before' AND constraint_time IS NOT NULL AND end_time IS NULL;

-- Step 4: Drop the old unique constraint if it exists (to allow multiple slots per day)
ALTER TABLE public.trainer_availability 
  DROP CONSTRAINT IF EXISTS trainer_availability_trainer_id_day_of_week_key;

-- Step 5: Create new unique constraint for trainer_id + day_of_week + start_time + end_time
-- This allows multiple time slots per day
DROP INDEX IF EXISTS idx_trainer_availability_unique_slot;
CREATE UNIQUE INDEX IF NOT EXISTS idx_trainer_availability_unique_slot 
ON public.trainer_availability(
  trainer_id, 
  day_of_week, 
  COALESCE(start_time, '00:00:00'::time), 
  COALESCE(end_time, '23:59:59'::time)
);

-- Step 6: Add comments
COMMENT ON COLUMN public.trainer_availability.start_time IS 'Start time of availability slot in 24-hour format (e.g., 17:00 for 5:00 PM). NULL means available from start of day.';
COMMENT ON COLUMN public.trainer_availability.end_time IS 'End time of availability slot in 24-hour format (e.g., 19:00 for 7:00 PM). NULL means available until end of day.';

-- Step 7: Verify the columns exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trainer_availability' 
    AND column_name = 'start_time'
    AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trainer_availability' 
    AND column_name = 'end_time'
    AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ Successfully added start_time and end_time columns to trainer_availability table';
  ELSE
    RAISE WARNING '❌ Failed to add columns - please check the migration';
  END IF;
END $$;

