-- Fix RLS Policies for Community Events
-- Run this AFTER the main setup script if you still get errors

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow trainers and admins to create community events" ON public.community_events;

-- Create a simpler policy that checks user_roles table instead of raw_user_meta_data
CREATE POLICY "Allow trainers and admins to create community events" ON public.community_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND (ur.role = 'trainer' OR ur.role = 'admin')
    )
  );

-- Also allow event creators to read their own events (including drafts)
DROP POLICY IF EXISTS "Allow event creators to read their events" ON public.community_events;
CREATE POLICY "Allow event creators to read their events" ON public.community_events
  FOR SELECT USING (created_by = auth.uid() OR status = 'active');

-- Test the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('community_events', 'community_event_participants')
ORDER BY tablename, policyname;
