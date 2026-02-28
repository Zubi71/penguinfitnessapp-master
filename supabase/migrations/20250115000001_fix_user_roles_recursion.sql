-- Fix infinite recursion in user_roles RLS policies
-- The issue is that the admin policy queries user_roles table, creating a circular dependency

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Create a simpler policy that doesn't cause recursion
-- We'll use a different approach - allow service role to manage all roles
-- and regular users can only manage their own roles

-- Policy for users to view their own role
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to insert their own role (during registration)
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
CREATE POLICY "Users can insert their own role" ON user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own role (if needed)
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;
CREATE POLICY "Users can update their own role" ON user_roles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow service role to manage all roles (for admin operations)
-- This is safe because service role bypasses RLS
GRANT ALL ON user_roles TO service_role;

-- Grant basic permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_roles TO authenticated;
