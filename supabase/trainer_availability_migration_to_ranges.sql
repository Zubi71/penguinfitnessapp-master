-- Migration: Update trainer_availability to support time ranges instead of before/after constraints
-- This allows trainers to enter time ranges like "5-7" or "8-9"

-- Step 1: Drop the unique constraint to allow multiple time slots per day
ALTER TABLE public.trainer_availability DROP CONSTRAINT IF EXISTS trainer_availability_trainer_id_day_of_week_key;

-- Step 2: Add new columns for time ranges
ALTER TABLE public.trainer_availability ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.trainer_availability ADD COLUMN IF NOT EXISTS end_time TIME;

-- Step 3: Migrate existing data
-- Convert "free" constraint_type to NULL start_time and end_time (all day)
UPDATE public.trainer_availability 
SET start_time = NULL, end_time = NULL
WHERE constraint_type = 'free';

-- Convert "after" constraint_type to start_time only (available from that time onwards)
UPDATE public.trainer_availability 
SET start_time = constraint_time, end_time = NULL
WHERE constraint_type = 'after' AND constraint_time IS NOT NULL;

-- Convert "before" constraint_type to end_time only (available up to that time)
UPDATE public.trainer_availability 
SET start_time = NULL, end_time = constraint_time
WHERE constraint_type = 'before' AND constraint_time IS NOT NULL;

-- Step 4: Drop old columns (after migration)
-- Note: We'll keep them for now in case of rollback, but mark as deprecated
-- ALTER TABLE public.trainer_availability DROP COLUMN IF EXISTS constraint_type;
-- ALTER TABLE public.trainer_availability DROP COLUMN IF EXISTS constraint_time;

-- Step 5: Add new unique constraint for trainer_id + day_of_week + start_time + end_time
-- This allows multiple time slots per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_trainer_availability_unique_slot 
ON public.trainer_availability(trainer_id, day_of_week, COALESCE(start_time, '00:00:00'::time), COALESCE(end_time, '23:59:59'::time));

-- Step 6: Add comments
COMMENT ON COLUMN public.trainer_availability.start_time IS 'Start time of availability slot in 24-hour format (e.g., 17:00 for 5:00 PM). NULL means available from start of day.';
COMMENT ON COLUMN public.trainer_availability.end_time IS 'End time of availability slot in 24-hour format (e.g., 19:00 for 7:00 PM). NULL means available until end of day.';
COMMENT ON COLUMN public.trainer_availability.constraint_type IS 'DEPRECATED: Use start_time and end_time instead';
COMMENT ON COLUMN public.trainer_availability.constraint_time IS 'DEPRECATED: Use start_time and end_time instead';

