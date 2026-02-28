-- Migration: Fix email constraint and restructure client signup for 2-step form
-- Date: 2025-07-14
-- Description: 
-- 1. Fix the email format constraint regex pattern
-- 2. Restructure client_signups table for 2-step registration (info + contact/register)
-- 3. Remove emergency contact requirements (make optional)
-- 4. Optimize for simplified registration flow

-- Step 1: Drop the existing email constraint
ALTER TABLE public.client_signups DROP CONSTRAINT IF EXISTS email_format;

-- Step 2: Add the corrected email constraint
ALTER TABLE public.client_signups ADD CONSTRAINT email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Step 3: Make all emergency contact fields optional (already nullable in schema)
-- These fields are already nullable, so no changes needed for:
-- parent_first_name, parent_last_name, parent_relationship, parent_email, parent_phone

-- Step 4: Make form-related fields optional with defaults for 2-step registration
ALTER TABLE public.client_signups ALTER COLUMN preferred_days DROP NOT NULL;
ALTER TABLE public.client_signups ALTER COLUMN preferred_days SET DEFAULT ARRAY['flexible'];

ALTER TABLE public.client_signups ALTER COLUMN preferred_start_time DROP NOT NULL;
ALTER TABLE public.client_signups ALTER COLUMN preferred_start_time SET DEFAULT 'flexible';

ALTER TABLE public.client_signups ALTER COLUMN location DROP NOT NULL;
ALTER TABLE public.client_signups ALTER COLUMN location SET DEFAULT 'main gym';

ALTER TABLE public.client_signups ALTER COLUMN type_of_lesson DROP NOT NULL;
ALTER TABLE public.client_signups ALTER COLUMN type_of_lesson SET DEFAULT 'Basic Package';

-- Step 5: Add new fields for 2-step registration flow
ALTER TABLE public.client_signups ADD COLUMN IF NOT EXISTS registration_step INTEGER DEFAULT 1 CHECK (registration_step IN (1, 2));
ALTER TABLE public.client_signups ADD COLUMN IF NOT EXISTS form_completed BOOLEAN DEFAULT FALSE;

-- Step 6: Update existing records to use defaults
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

-- Step 7: Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_client_signups_registration_step ON public.client_signups(registration_step);
CREATE INDEX IF NOT EXISTS idx_client_signups_form_completed ON public.client_signups(form_completed);

-- Step 8: Add comment to document the 2-step registration structure
COMMENT ON TABLE public.client_signups IS 'Client signup table with 2-step registration:
Step 1: Basic info (first_name, last_name, email, phone, birthday, gender)
Step 2: Contact/Registration (password, preferences, service selection)
Emergency contact fields are optional and can be added later.';

COMMENT ON COLUMN public.client_signups.registration_step IS 'Current step in registration process: 1=basic info, 2=contact/register';
COMMENT ON COLUMN public.client_signups.form_completed IS 'Whether the full registration form has been completed';
