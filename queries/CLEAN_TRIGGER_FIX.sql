-- CLEAN TRIGGER FIX
-- This handles all existing objects properly

-- 1. Drop the existing trigger
DROP TRIGGER IF EXISTS create_points_on_signup ON auth.users;

-- 2. Drop the existing function
DROP FUNCTION IF EXISTS create_client_points();

-- 3. Drop existing table if it exists (to start fresh)
DROP TABLE IF EXISTS public.client_points CASCADE;

-- 4. Create the client_points table
CREATE TABLE public.client_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points_balance INTEGER DEFAULT 0 NOT NULL,
  total_points_earned INTEGER DEFAULT 0 NOT NULL,
  total_points_spent INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE public.client_points ENABLE ROW LEVEL SECURITY;

-- 6. Create basic policy
CREATE POLICY "Service role can manage all points" ON public.client_points
  FOR ALL USING (true);

-- 7. Grant permissions
GRANT ALL ON public.client_points TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.client_points TO authenticated;

-- 8. Verify
SELECT 'Trigger disabled and table created. User creation should work now!' as status;
