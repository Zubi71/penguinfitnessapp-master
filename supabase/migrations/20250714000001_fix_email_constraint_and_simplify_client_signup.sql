-- Migration: Fix email constraint and simplify client signup
-- Date: 2025-07-14
-- Description: 
-- 1. Fix the email format constraint regex pattern
-- 2. Make emergency contact fields optional (remove NOT NULL constraints)
-- 3. Make preferred_days optional with default value

-- Step 1: Drop the existing email constraint
ALTER TABLE public.client_signups DROP CONSTRAINT IF EXISTS email_format;

-- Step 2: Add the corrected email constraint
ALTER TABLE public.client_signups ADD CONSTRAINT email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Step 3: Make preferred_days optional (allow NULL and set default)
ALTER TABLE public.client_signups ALTER COLUMN preferred_days DROP NOT NULL;
ALTER TABLE public.client_signups ALTER COLUMN preferred_days SET DEFAULT ARRAY['flexible'];

-- Step 4: Make preferred_start_time optional with default
ALTER TABLE public.client_signups ALTER COLUMN preferred_start_time DROP NOT NULL;
ALTER TABLE public.client_signups ALTER COLUMN preferred_start_time SET DEFAULT 'flexible';

-- Step 5: Make location optional with default
ALTER TABLE public.client_signups ALTER COLUMN location DROP NOT NULL;
ALTER TABLE public.client_signups ALTER COLUMN location SET DEFAULT 'main gym';

-- Step 6: Make type_of_lesson optional with default
ALTER TABLE public.client_signups ALTER COLUMN type_of_lesson DROP NOT NULL;
ALTER TABLE public.client_signups ALTER COLUMN type_of_lesson SET DEFAULT 'Basic Package';

-- Step 7: Update existing NULL values to use defaults
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

-- Step 8: Add comment to document the changes
COMMENT ON TABLE public.client_signups IS 'Client signup table - simplified to only require basic information for registration. Emergency contact and other details are optional.';
