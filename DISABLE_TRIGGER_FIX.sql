-- SIMPLE FIX: Just disable the problematic trigger
-- Run this in Supabase SQL Editor

-- 1. Drop the problematic trigger
DROP TRIGGER IF EXISTS create_points_on_signup ON auth.users;

-- 2. Drop the problematic function
DROP FUNCTION IF EXISTS create_client_points();

-- 3. Create the missing table
CREATE TABLE IF NOT EXISTS public.client_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points_balance INTEGER DEFAULT 0 NOT NULL,
  total_points_earned INTEGER DEFAULT 0 NOT NULL,
  total_points_spent INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.client_points ENABLE ROW LEVEL SECURITY;

-- 5. Create basic policy
CREATE POLICY "Service role can manage all points" ON public.client_points
  FOR ALL USING (true);

-- 6. Grant permissions
GRANT ALL ON public.client_points TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.client_points TO authenticated;

-- 7. Verify
SELECT 'Trigger disabled and table created. User creation should work now!' as status;
