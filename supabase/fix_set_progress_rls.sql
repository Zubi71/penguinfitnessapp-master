-- Fix RLS policies for set_progress table
-- Drop existing policies
DROP POLICY IF EXISTS "Trainers can view their client's set progress" ON public.set_progress;
DROP POLICY IF EXISTS "Trainers can insert their client's set progress" ON public.set_progress;
DROP POLICY IF EXISTS "Trainers can update their client's set progress" ON public.set_progress;
DROP POLICY IF EXISTS "Trainers can delete their client's set progress" ON public.set_progress;
DROP POLICY IF EXISTS "Clients can view their own set progress" ON public.set_progress;

-- Create corrected RLS policies
-- Trainers can view their client's set progress (check via trainers table)
CREATE POLICY "Trainers can view their client's set progress" ON public.set_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trainers 
      WHERE trainers.id = set_progress.trainer_id 
      AND trainers.user_id = auth.uid()
    )
  );

-- Trainers can insert their client's set progress
CREATE POLICY "Trainers can insert their client's set progress" ON public.set_progress
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trainers 
      WHERE trainers.id = set_progress.trainer_id 
      AND trainers.user_id = auth.uid()
    )
  );

-- Trainers can update their client's set progress
CREATE POLICY "Trainers can update their client's set progress" ON public.set_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trainers 
      WHERE trainers.id = set_progress.trainer_id 
      AND trainers.user_id = auth.uid()
    )
  );

-- Trainers can delete their client's set progress
CREATE POLICY "Trainers can delete their client's set progress" ON public.set_progress
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.trainers 
      WHERE trainers.id = set_progress.trainer_id 
      AND trainers.user_id = auth.uid()
    )
  );

-- Clients can view their own progress (check via clients table using email)
CREATE POLICY "Clients can view their own set progress" ON public.set_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = set_progress.client_id 
      AND clients.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- Clients can insert their own progress
CREATE POLICY "Clients can insert their own set progress" ON public.set_progress
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = set_progress.client_id 
      AND clients.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- Clients can update their own progress
CREATE POLICY "Clients can update their own set progress" ON public.set_progress
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = set_progress.client_id 
      AND clients.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- Clients can delete their own progress
CREATE POLICY "Clients can delete their own set progress" ON public.set_progress
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.clients 
      WHERE clients.id = set_progress.client_id 
      AND clients.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  ); 