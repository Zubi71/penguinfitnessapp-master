-- Quick fix for email constraint issue
-- Run this directly in Supabase SQL Editor

-- Step 1: Drop the existing email constraint
ALTER TABLE public.client_signups DROP CONSTRAINT IF EXISTS email_format;

-- Step 2: Add the corrected email constraint (removed the extra backslash)
ALTER TABLE public.client_signups ADD CONSTRAINT email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Step 3: Make fields optional for simplified registration
ALTER TABLE public.client_signups ALTER COLUMN preferred_days DROP NOT NULL;
ALTER TABLE public.client_signups ALTER COLUMN preferred_days SET DEFAULT ARRAY['flexible'];

ALTER TABLE public.client_signups ALTER COLUMN preferred_start_time DROP NOT NULL;
ALTER TABLE public.client_signups ALTER COLUMN preferred_start_time SET DEFAULT 'flexible';

ALTER TABLE public.client_signups ALTER COLUMN location DROP NOT NULL;
ALTER TABLE public.client_signups ALTER COLUMN location SET DEFAULT 'main gym';

ALTER TABLE public.client_signups ALTER COLUMN type_of_lesson DROP NOT NULL;
ALTER TABLE public.client_signups ALTER COLUMN type_of_lesson SET DEFAULT 'Basic Package';

-- Step 4: Add registration flow control fields if they don't exist
ALTER TABLE public.client_signups ADD COLUMN IF NOT EXISTS registration_step INTEGER DEFAULT 1 CHECK (registration_step IN (1, 2));
ALTER TABLE public.client_signups ADD COLUMN IF NOT EXISTS form_completed BOOLEAN DEFAULT FALSE;

-- Step 5: Update existing records to use defaults
UPDATE public.client_signups 
SET preferred_days = ARRAY['flexible'] 
WHERE preferred_days IS NULL;

UPDATE public.client_signups 
SET preferred_start_time = 'flexible' 
WHERE preferred_start_time IS NULL OR preferred_start_time = '';

UPDATE public.client_signups 
SET location = 'main gym' 
WHERE location IS NULL OR location = '';

UPDATE public.client_signups 
SET type_of_lesson = 'Basic Package' 
WHERE type_of_lesson IS NULL OR type_of_lesson = '';

UPDATE public.client_signups 
SET registration_step = 2, form_completed = TRUE 
WHERE email IS NOT NULL AND first_name IS NOT NULL AND last_name IS NOT NULL;

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_signups_registration_step ON public.client_signups(registration_step);
CREATE INDEX IF NOT EXISTS idx_client_signups_form_completed ON public.client_signups(form_completed);

-- Verify the fix by testing the constraint
-- This should work now:
-- INSERT INTO public.client_signups (first_name, last_name, email, phone) 
-- VALUES ('Test', 'User', 'test@example.com', '+1234567890');

-- Add comment
COMMENT ON TABLE public.client_signups IS 'Client signup table with 2-step registration and fixed email constraint';
