-- Migration: Replace coach references with trainer references
-- This migration updates the schema to use trainer terminology

-- Step 1: Create trainers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.trainers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for trainers table
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trainers table
DO $$
BEGIN
  -- Drop existing policies if they exist, then recreate them
  DROP POLICY IF EXISTS "Allow admin and trainer to view all trainers" ON public.trainers;
  DROP POLICY IF EXISTS "Allow admin and trainer registration to insert trainers" ON public.trainers;
  DROP POLICY IF EXISTS "Allow admin to update trainers" ON public.trainers;
  DROP POLICY IF EXISTS "Allow admin to delete trainers" ON public.trainers;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Allow admin and trainer to view all trainers" ON public.trainers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  ) OR
  user_id = auth.uid()
);

CREATE POLICY "Allow admin and trainer registration to insert trainers" ON public.trainers FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) OR
  user_id = auth.uid()
);

CREATE POLICY "Allow admin to update trainers" ON public.trainers FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Allow admin to delete trainers" ON public.trainers FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_trainers_updated_at' 
    AND event_object_table = 'trainers'
  ) THEN
    CREATE TRIGGER update_trainers_updated_at 
      BEFORE UPDATE ON public.trainers 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Step 2: Add new trainer_id column to training_sessions table
ALTER TABLE public.training_sessions 
ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL;

-- Step 3: Copy data from coaches table to trainers table (if coaches table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coaches') THEN
    INSERT INTO public.trainers (id, user_id, first_name, last_name, email, phone, hire_date, created_at, updated_at)
    SELECT id, user_id, first_name, last_name, email, phone, hire_date, created_at, updated_at
    FROM public.coaches
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;

-- Step 4: Update trainer_id in training_sessions based on coach_id
UPDATE public.training_sessions 
SET trainer_id = coach_id 
WHERE coach_id IS NOT NULL AND trainer_id IS NULL;

-- Step 5: Create index for new trainer_id column
CREATE INDEX IF NOT EXISTS idx_training_sessions_trainer_id ON public.training_sessions(trainer_id);

-- Step 6: Rename coaches table to trainers_legacy for backward compatibility (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coaches') THEN
    ALTER TABLE public.coaches RENAME TO trainers_legacy;
  END IF;
END $$;

-- Step 7: Update any other references (add more as needed)
-- Note: Keep coach_id for backward compatibility, but trainer_id is the new primary reference

-- Step 8: Add comment to indicate the migration
COMMENT ON COLUMN public.training_sessions.trainer_id IS 'Primary trainer reference (replaces coach_id)';
COMMENT ON COLUMN public.training_sessions.coach_id IS 'Deprecated: use trainer_id instead';
