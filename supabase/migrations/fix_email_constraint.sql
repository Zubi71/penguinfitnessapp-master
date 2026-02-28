-- Fix email format constraint in client_signups table
-- Remove the incorrect constraint
ALTER TABLE public.client_signups DROP CONSTRAINT IF EXISTS email_format;

-- Add the correct constraint with proper regex
ALTER TABLE public.client_signups ADD CONSTRAINT email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
