# 🚨 URGENT: Database Setup Required

The error `Error creating event: {}` means the database tables don't exist yet.

## Follow these steps EXACTLY:

### Step 1: Go to Supabase Dashboard
1. Open your browser
2. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
3. Select your project

### Step 2: Open SQL Editor
1. In the left sidebar, click "SQL Editor"
2. Click "New query"

### Step 3: Copy and Paste This SQL
Copy the ENTIRE content below and paste it into the SQL Editor:

```sql
-- Community Events Setup Script
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Community Events table
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

-- Insert some sample data for testing
INSERT INTO public.community_events (
  title, 
  description, 
  event_date, 
  start_time, 
  end_time, 
  location, 
  event_type, 
  difficulty_level, 
  price, 
  status
) VALUES 
(
  'Morning Yoga Session',
  'Start your day with a refreshing yoga session suitable for all levels.',
  CURRENT_DATE + INTERVAL '2 days',
  '07:00:00',
  '08:00:00',
  'Main Studio',
  'workshop',
  'all',
  15.00,
  'active'
),
(
  'HIIT Challenge',
  'High-intensity interval training challenge for intermediate to advanced fitness enthusiasts.',
  CURRENT_DATE + INTERVAL '5 days',
  '18:00:00',
  '19:00:00',
  'Gym Floor',
  'challenge',
  'intermediate',
  20.00,
  'active'
),
(
  'Community Run',
  'Join us for a community 5K run around the neighborhood. All paces welcome!',
  CURRENT_DATE + INTERVAL '7 days',
  '08:00:00',
  '09:30:00',
  'Starting at Gym',
  'social',
  'all',
  0.00,
  'active'
)
ON CONFLICT DO NOTHING;
```

### Step 4: Run the SQL
1. Click the "Run" button (or press Ctrl+Enter)
2. Wait for it to complete successfully

### Step 5: Verify Tables Created
1. Go to "Table Editor" in the left sidebar
2. You should see two new tables:
   - `community_events`
   - `community_event_participants`

### Step 6: Test the Feature
1. Go back to your app
2. Try creating an event again
3. The error should be gone!

## If you still get errors:
1. Check the browser console for more details
2. Make sure you're logged in as a trainer or admin
3. Try refreshing the page after running the SQL

The empty error `{}` will disappear once the database tables are created!
