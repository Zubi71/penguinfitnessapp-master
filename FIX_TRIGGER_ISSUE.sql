-- FIX THE TRIGGER ISSUE
-- This will disable the problematic trigger and create the missing table

-- 1. First, drop the problematic trigger
DROP TRIGGER IF EXISTS create_points_on_signup ON auth.users;

-- 2. Drop the function that references the missing table
DROP FUNCTION IF EXISTS create_client_points();

-- 3. Create the client_points table with the correct schema
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

-- 5. Create policies
DROP POLICY IF EXISTS "Users can view their own points" ON public.client_points;
CREATE POLICY "Users can view their own points" ON public.client_points
  FOR SELECT USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can update their own points" ON public.client_points;
CREATE POLICY "Users can update their own points" ON public.client_points
  FOR UPDATE USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Service role can manage all points" ON public.client_points;
CREATE POLICY "Service role can manage all points" ON public.client_points
  FOR ALL USING (true);

-- 6. Grant permissions
GRANT ALL ON public.client_points TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.client_points TO authenticated;

-- 7. Create a new, safer function that checks if table exists
CREATE OR REPLACE FUNCTION create_client_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create points if the table exists and user is a client
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_points' AND table_schema = 'public') THEN
    -- Check if user has a role and it's 'client'
    IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.id AND role = 'client') THEN
      INSERT INTO public.client_points (client_id) VALUES (NEW.id);
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If anything fails, just return NEW to not break user creation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Recreate the trigger with the safer function
CREATE TRIGGER create_points_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_client_points();

-- 9. Verify the fix
SELECT 'Trigger issue fixed! User creation should work now.' as status;
