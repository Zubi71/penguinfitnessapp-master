-- Quick fix to ensure instructors table exists for foreign key compatibility
-- This addresses the "relation 'public.instructors' does not exist" error

-- Create instructors table if it doesn't exist (should match schema.sql)
CREATE TABLE IF NOT EXISTS public.instructors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  certifications TEXT[],
  specialties TEXT[],
  hourly_rate DECIMAL(10,2),
  bio TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for instructors table
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for instructors table
DO $$
BEGIN
  -- Drop existing policies if they exist, then recreate them
  DROP POLICY IF EXISTS "Allow admin and trainer to view all instructors" ON public.instructors;
  DROP POLICY IF EXISTS "Allow admin and trainer registration to insert instructors" ON public.instructors;
  DROP POLICY IF EXISTS "Allow admin to update instructors" ON public.instructors;
  DROP POLICY IF EXISTS "Allow admin to delete instructors" ON public.instructors;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Allow admin and trainer to view all instructors" ON public.instructors FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  ) OR
  user_id = auth.uid()
);

CREATE POLICY "Allow admin and trainer registration to insert instructors" ON public.instructors FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) OR
  user_id = auth.uid()
);

CREATE POLICY "Allow admin to update instructors" ON public.instructors FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Allow admin to delete instructors" ON public.instructors FOR DELETE USING (
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
    WHERE trigger_name = 'update_instructors_updated_at' 
    AND event_object_table = 'instructors'
  ) THEN
    CREATE TRIGGER update_instructors_updated_at 
      BEFORE UPDATE ON public.instructors 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Copy any existing trainer data to instructors table for compatibility
-- (This ensures existing trainer data is available in instructors table)
INSERT INTO public.instructors (user_id, first_name, last_name, email, phone, hire_date, created_at, updated_at)
SELECT user_id, first_name, last_name, email, phone, hire_date, created_at, updated_at
FROM public.trainers
ON CONFLICT (email) DO NOTHING;

-- Also copy from trainers_legacy if it exists
INSERT INTO public.instructors (user_id, first_name, last_name, email, phone, hire_date, created_at, updated_at)
SELECT user_id, first_name, last_name, email, phone, hire_date, created_at, updated_at
FROM public.trainers_legacy
ON CONFLICT (email) DO NOTHING;
