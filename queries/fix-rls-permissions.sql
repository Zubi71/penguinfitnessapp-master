-- Fix RLS Permissions for Community Events
-- This fixes the "permission denied for table users" error

-- Drop existing policies
DROP POLICY IF EXISTS "Allow trainers and admins to create community events" ON public.community_events;
DROP POLICY IF EXISTS "Allow read access to active community events" ON public.community_events;
DROP POLICY IF EXISTS "Allow event creators to update events" ON public.community_events;
DROP POLICY IF EXISTS "Allow event creators to delete events" ON public.community_events;

-- Drop participant policies
DROP POLICY IF EXISTS "Allow users to see their own registrations" ON public.community_event_participants;
DROP POLICY IF EXISTS "Allow users to register for events" ON public.community_event_participants;
DROP POLICY IF EXISTS "Allow users to update their own registrations" ON public.community_event_participants;
DROP POLICY IF EXISTS "Allow users to cancel their own registrations" ON public.community_event_participants;
DROP POLICY IF EXISTS "Allow event creators to see participants" ON public.community_event_participants;

-- Create simpler policies that don't require auth.users access
-- Allow all authenticated users to read active events
CREATE POLICY "Allow read access to active community events" ON public.community_events
  FOR SELECT USING (status = 'active');

-- Allow any authenticated user to create events (we'll check roles in the API)
CREATE POLICY "Allow authenticated users to create community events" ON public.community_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow event creators to update their events
CREATE POLICY "Allow event creators to update events" ON public.community_events
  FOR UPDATE USING (created_by = auth.uid());

-- Allow event creators to delete their events
CREATE POLICY "Allow event creators to delete events" ON public.community_events
  FOR DELETE USING (created_by = auth.uid());

-- Allow event creators to read their own events (including drafts)
CREATE POLICY "Allow event creators to read their events" ON public.community_events
  FOR SELECT USING (created_by = auth.uid() OR status = 'active');

-- Participants policies
CREATE POLICY "Allow users to see their own registrations" ON public.community_event_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow users to register for events" ON public.community_event_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to update their own registrations" ON public.community_event_participants
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Allow users to cancel their own registrations" ON public.community_event_participants
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Allow event creators to see participants" ON public.community_event_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_events ce
      WHERE ce.id = community_event_participants.event_id
      AND ce.created_by = auth.uid()
    )
  );

-- Verify policies were created
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
