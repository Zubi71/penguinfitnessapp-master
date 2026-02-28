# 🔧 Community Events Troubleshooting Guide

## Current Issue: `Error creating event: {}`

This empty error object indicates that the database tables don't exist or there are permission issues.

## Step-by-Step Fix

### 1. **FIRST: Run Database Migration**

**Go to Supabase Dashboard:**
1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New query"

**Copy and paste this SQL:**

```sql
-- Community Events Setup Script
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
  UNIQUE(event_id, user_id)
);

-- RLS Policies
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_event_participants ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read active events
CREATE POLICY "Allow read access to active community events" ON public.community_events
  FOR SELECT USING (status = 'active');

-- Allow trainers and admins to create events
CREATE POLICY "Allow trainers and admins to create community events" ON public.community_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND (ur.role = 'trainer' OR ur.role = 'admin')
    )
  );

-- Allow event creators to update their events
CREATE POLICY "Allow event creators to update events" ON public.community_events
  FOR UPDATE USING (created_by = auth.uid());

-- Allow event creators to delete their events
CREATE POLICY "Allow event creators to delete events" ON public.community_events
  FOR DELETE USING (created_by = auth.uid());

-- Allow event creators to read their own events
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_community_events_date ON public.community_events(event_date);
CREATE INDEX IF NOT EXISTS idx_community_events_status ON public.community_events(status);
CREATE INDEX IF NOT EXISTS idx_community_events_created_by ON public.community_events(created_by);
CREATE INDEX IF NOT EXISTS idx_community_event_participants_event_id ON public.community_event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_community_event_participants_user_id ON public.community_event_participants(user_id);

-- Insert sample data
INSERT INTO public.community_events (
  title, description, event_date, start_time, end_time, location, event_type, difficulty_level, price, status
) VALUES 
('Morning Yoga Session', 'Start your day with a refreshing yoga session suitable for all levels.', CURRENT_DATE + INTERVAL '2 days', '07:00:00', '08:00:00', 'Main Studio', 'workshop', 'all', 15.00, 'active'),
('HIIT Challenge', 'High-intensity interval training challenge for intermediate to advanced fitness enthusiasts.', CURRENT_DATE + INTERVAL '5 days', '18:00:00', '19:00:00', 'Gym Floor', 'challenge', 'intermediate', 20.00, 'active'),
('Community Run', 'Join us for a community 5K run around the neighborhood. All paces welcome!', CURRENT_DATE + INTERVAL '7 days', '08:00:00', '09:30:00', 'Starting at Gym', 'social', 'all', 0.00, 'active')
ON CONFLICT DO NOTHING;
```

**Click "Run" and wait for completion.**

### 2. **Test Database Connection**

Visit: `http://localhost:3000/api/test-community-events`

**Expected Response:**
```json
{
  "success": true,
  "tables": {
    "community_events": {
      "exists": true,
      "error": null
    },
    "community_event_participants": {
      "exists": true,
      "error": null
    }
  }
}
```

### 3. **Debug User Permissions**

Visit: `http://localhost:3000/api/debug-community-events`

This will show:
- Your user ID and email
- Your role from the `user_roles` table
- Whether you can access the tables
- Any authentication errors

### 4. **Check Your User Role**

Make sure your user has the correct role in the `user_roles` table:

```sql
-- Check your role
SELECT * FROM user_roles WHERE user_id = 'your-user-id-here';

-- If you need to set your role as trainer/admin:
INSERT INTO user_roles (user_id, role) 
VALUES ('your-user-id-here', 'trainer') 
ON CONFLICT (user_id) DO UPDATE SET role = 'trainer';
```

### 5. **Test the Feature**

1. **Refresh your browser**
2. **Go to Dashboard → Community Events**
3. **Try creating an event**

## Common Issues & Solutions

### Issue 1: "Table doesn't exist"
**Solution:** Run the SQL migration script above

### Issue 2: "Permission denied"
**Solution:** Check your user role in the `user_roles` table

### Issue 3: "RLS policy violation"
**Solution:** The RLS policies have been updated to use `user_roles` table instead of `raw_user_meta_data`

### Issue 4: "Authentication error"
**Solution:** Make sure you're logged in and your session is valid

## Verification Checklist

- [ ] SQL migration completed successfully
- [ ] Test endpoint returns success
- [ ] Debug endpoint shows correct user role
- [ ] Can access community events dashboard
- [ ] Can create new events
- [ ] No console errors

## If Still Having Issues

1. **Check browser console** for detailed error messages
2. **Check Network tab** for failed API requests
3. **Verify Supabase connection** in your environment variables
4. **Test with a different user** (trainer/admin role)

The empty error `{}` should disappear once the database tables are properly created and your user has the correct permissions!
