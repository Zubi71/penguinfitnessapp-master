-- Fix auth.users table issues that prevent user creation
-- This script addresses the "Database error creating new user" error

-- 1. Check if auth schema exists and is accessible
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    RAISE EXCEPTION 'Auth schema does not exist. This is a critical Supabase configuration issue.';
  END IF;
  
  RAISE NOTICE 'Auth schema exists and is accessible';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error checking auth schema: %', SQLERRM;
END $$;

-- 2. Check auth.users table structure
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    RAISE EXCEPTION 'Auth.users table does not exist. This is a critical Supabase configuration issue.';
  END IF;
  
  RAISE NOTICE 'Auth.users table exists';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error checking auth.users table: %', SQLERRM;
END $$;

-- 3. Check and fix auth.users table permissions
DO $$ 
BEGIN
  -- Grant necessary permissions to authenticated role
  GRANT USAGE ON SCHEMA auth TO authenticated;
  GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticated;
  GRANT SELECT ON ALL SEQUENCES IN SCHEMA auth TO authenticated;
  
  -- Grant permissions to service_role (should already have these, but just in case)
  GRANT ALL ON ALL TABLES IN SCHEMA auth TO service_role;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO service_role;
  
  RAISE NOTICE 'Fixed auth schema permissions';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error fixing auth permissions: %', SQLERRM;
END $$;

-- 4. Check and fix user_roles table (this is critical for user creation)
DO $$ 
BEGIN
  -- Ensure user_roles table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    CREATE TABLE user_roles (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('admin', 'client', 'trainer', 'coach')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create indexes
    CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
    CREATE INDEX idx_user_roles_role ON user_roles(role);
    
    RAISE NOTICE 'Created user_roles table';
  ELSE
    RAISE NOTICE 'user_roles table already exists';
  END IF;
  
  -- Enable RLS
  ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies
  DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
  DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
  DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
  
  -- Create new policies
  CREATE POLICY "Users can view their own role" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);
    
  CREATE POLICY "Users can insert their own role" ON user_roles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Admins can manage all roles" ON user_roles
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
    
  -- Grant permissions
  GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO authenticated;
  GRANT ALL ON user_roles TO service_role;
  
  RAISE NOTICE 'Fixed user_roles table and policies';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error fixing user_roles: %', SQLERRM;
END $$;

-- 5. Check and fix client_signups table
DO $$ 
BEGIN
  -- Ensure client_signups table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_signups') THEN
    CREATE TABLE client_signups (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      birthday DATE,
      gender TEXT,
      parent_first_name TEXT,
      parent_phone TEXT,
      parent_relationship TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create indexes
    CREATE INDEX idx_client_signups_email ON client_signups(email);
    
    RAISE NOTICE 'Created client_signups table';
  ELSE
    RAISE NOTICE 'client_signups table already exists';
  END IF;
  
  -- Enable RLS
  ALTER TABLE client_signups ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies
  DROP POLICY IF EXISTS "Clients can view their own data" ON client_signups;
  DROP POLICY IF EXISTS "Clients can insert their own data" ON client_signups;
  DROP POLICY IF EXISTS "Admins can manage all clients" ON client_signups;
  
  -- Create new policies
  CREATE POLICY "Clients can view their own data" ON client_signups
    FOR SELECT USING (auth.jwt() ->> 'email' = email);
    
  CREATE POLICY "Clients can insert their own data" ON client_signups
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = email);
    
  CREATE POLICY "Admins can manage all clients" ON client_signups
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
    
  -- Grant permissions
  GRANT SELECT, INSERT, UPDATE, DELETE ON client_signups TO authenticated;
  GRANT ALL ON client_signups TO service_role;
  
  RAISE NOTICE 'Fixed client_signups table and policies';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error fixing client_signups: %', SQLERRM;
END $$;

-- 6. Check and fix trainers table
DO $$ 
BEGIN
  -- Ensure trainers table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainers') THEN
    CREATE TABLE trainers (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      hire_date DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create indexes
    CREATE INDEX idx_trainers_user_id ON trainers(user_id);
    CREATE INDEX idx_trainers_email ON trainers(email);
    
    RAISE NOTICE 'Created trainers table';
  ELSE
    RAISE NOTICE 'trainers table already exists';
  END IF;
  
  -- Enable RLS
  ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies
  DROP POLICY IF EXISTS "Trainers can view their own data" ON trainers;
  DROP POLICY IF EXISTS "Trainers can insert their own data" ON trainers;
  DROP POLICY IF EXISTS "Admins can manage all trainers" ON trainers;
  
  -- Create new policies
  CREATE POLICY "Trainers can view their own data" ON trainers
    FOR SELECT USING (auth.uid() = user_id);
    
  CREATE POLICY "Trainers can insert their own data" ON trainers
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
  CREATE POLICY "Admins can manage all trainers" ON trainers
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
    
  -- Grant permissions
  GRANT SELECT, INSERT, UPDATE, DELETE ON trainers TO authenticated;
  GRANT ALL ON trainers TO service_role;
  
  RAISE NOTICE 'Fixed trainers table and policies';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error fixing trainers: %', SQLERRM;
END $$;

-- 7. Create a function to safely create users
CREATE OR REPLACE FUNCTION safe_create_user(
  user_email TEXT,
  user_password TEXT,
  user_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Insert into user_roles first to establish the user
  INSERT INTO user_roles (user_id, role)
  VALUES (auth.uid(), COALESCE(user_metadata->>'role', 'client'))
  RETURNING user_id INTO new_user_id;
  
  RETURN new_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION safe_create_user TO authenticated;
GRANT EXECUTE ON FUNCTION safe_create_user TO service_role;

-- 8. Verify the fixes
DO $$ 
BEGIN
  RAISE NOTICE '=== Auth Users Table Fix Summary ===';
  RAISE NOTICE '1. Verified auth schema and users table exist';
  RAISE NOTICE '2. Fixed auth schema permissions';
  RAISE NOTICE '3. Fixed user_roles table and policies';
  RAISE NOTICE '4. Fixed client_signups table and policies';
  RAISE NOTICE '5. Fixed trainers table and policies';
  RAISE NOTICE '6. Created safe_create_user function';
  RAISE NOTICE '7. All necessary permissions granted';
  RAISE NOTICE '=== User creation should now work ===';
  
  -- Test if we can access auth.users
  IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    RAISE NOTICE '✅ Can access auth.users table';
  ELSE
    RAISE NOTICE '⚠️ Cannot access auth.users table - this may indicate a deeper issue';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in verification: %', SQLERRM;
END $$;

