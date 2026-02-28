-- Quick fix for executive_summaries RLS policy
-- Run this if you get "new row violates row-level security policy" error

-- Add INSERT policy for executive_summaries
CREATE POLICY "Admins can insert executive summaries" ON public.executive_summaries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

