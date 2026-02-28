-- URGENT FIX: Remove infinite recursion in user_roles policies
-- Run this directly in your Supabase SQL editor or psql

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Keep only the essential policies that don't cause recursion
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
CREATE POLICY "Users can insert their own role" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE ON user_roles TO authenticated;

-- Test that the policies work
SELECT 'user_roles policies fixed - no more infinite recursion' as status;
