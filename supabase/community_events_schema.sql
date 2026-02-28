-- Community Events Schema
-- This table stores community events that trainers/admins can create and clients can view

CREATE TABLE IF NOT EXISTS public.community_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  event_type TEXT DEFAULT 'community' CHECK (event_type IN ('community', 'workshop', 'challenge', 'social', 'competition')),
  difficulty_level TEXT DEFAULT 'all' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'all')),
  price DECIMAL(10,2) DEFAULT 0.00,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'draft')),
  is_featured BOOLEAN DEFAULT FALSE
);

-- Community Event Participants table
CREATE TABLE IF NOT EXISTS public.community_event_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'no_show', 'cancelled')),
  notes TEXT,
  UNIQUE(event_id, user_id) -- Prevent duplicate registrations
);

-- RLS Policies for community_events
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read active events
CREATE POLICY "Allow read access to active community events" ON public.community_events
  FOR SELECT USING (status = 'active');

-- Allow trainers and admins to create events
CREATE POLICY "Allow trainers and admins to create community events" ON public.community_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND (
        u.raw_user_meta_data->>'role' = 'trainer' OR
        u.raw_user_meta_data->>'role' = 'admin'
      )
    )
  );

-- Allow event creators to update their events
CREATE POLICY "Allow event creators to update events" ON public.community_events
  FOR UPDATE USING (created_by = auth.uid());

-- Allow event creators to delete their events
CREATE POLICY "Allow event creators to delete events" ON public.community_events
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for community_event_participants
ALTER TABLE public.community_event_participants ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own registrations
CREATE POLICY "Allow users to see their own registrations" ON public.community_event_participants
  FOR SELECT USING (user_id = auth.uid());

-- Allow users to register for events
CREATE POLICY "Allow users to register for events" ON public.community_event_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow users to update their own registrations
CREATE POLICY "Allow users to update their own registrations" ON public.community_event_participants
  FOR UPDATE USING (user_id = auth.uid());

-- Allow users to cancel their own registrations
CREATE POLICY "Allow users to cancel their own registrations" ON public.community_event_participants
  FOR DELETE USING (user_id = auth.uid());

-- Allow event creators to see all participants for their events
CREATE POLICY "Allow event creators to see participants" ON public.community_event_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.community_events ce
      WHERE ce.id = community_event_participants.event_id
      AND ce.created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_events_date ON public.community_events(event_date);
CREATE INDEX IF NOT EXISTS idx_community_events_status ON public.community_events(status);
CREATE INDEX IF NOT EXISTS idx_community_events_created_by ON public.community_events(created_by);
CREATE INDEX IF NOT EXISTS idx_community_event_participants_event_id ON public.community_event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_community_event_participants_user_id ON public.community_event_participants(user_id);
