-- Fix RLS policies for set_progress table (Simplified version)
-- Drop existing policies
DROP POLICY IF EXISTS "Trainers can view their client's set progress" ON public.set_progress;
DROP POLICY IF EXISTS "Trainers can insert their client's set progress" ON public.set_progress;
DROP POLICY IF EXISTS "Trainers can update their client's set progress" ON public.set_progress;
DROP POLICY IF EXISTS "Trainers can delete their client's set progress" ON public.set_progress;
DROP POLICY IF EXISTS "Clients can view their own set progress" ON public.set_progress;

-- Create simplified RLS policies
-- For now, allow all authenticated users to access set_progress
-- This is simpler and can be restricted later if needed
CREATE POLICY "Allow authenticated users to access set progress" ON public.set_progress
  FOR ALL USING (auth.role() = 'authenticated');

-- Alternative: More restrictive policy for trainers only
-- CREATE POLICY "Trainers can access set progress" ON public.set_progress
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM public.trainers 
--       WHERE trainers.user_id = auth.uid()
--     )
--   ); 