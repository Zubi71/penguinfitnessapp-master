-- DIAGNOSE: Find the exact cause of user creation error
-- Run this in Supabase SQL Editor to identify the issue

-- 1. Check if user_roles table exists and has correct structure
SELECT 
  'user_roles table check' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status,
  'Table should exist' as expected
UNION ALL

-- 2. Check user_roles table structure
SELECT 
  'user_roles structure' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_roles' 
      AND column_name = 'id' 
      AND data_type = 'bigint'
    ) THEN 'CORRECT' 
    ELSE 'WRONG STRUCTURE' 
  END as status,
  'Should have BIGINT id column' as expected
UNION ALL

-- 3. Check if app_role enum exists
SELECT 
  'app_role enum' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status,
  'Enum should exist' as expected
UNION ALL

-- 4. Check auth.users table constraints
SELECT 
  'auth.users constraints' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'users' 
      AND table_schema = 'auth'
    ) THEN 'HAS CONSTRAINTS' 
    ELSE 'NO CONSTRAINTS' 
  END as status,
  'Check for problematic constraints' as expected
UNION ALL

-- 5. Check for triggers on auth.users
SELECT 
  'auth.users triggers' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE event_object_table = 'users' 
      AND event_object_schema = 'auth'
    ) THEN 'HAS TRIGGERS' 
    ELSE 'NO TRIGGERS' 
  END as status,
  'Check for problematic triggers' as expected
UNION ALL

-- 6. Check RLS policies on user_roles
SELECT 
  'user_roles RLS policies' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_roles'
    ) THEN 'HAS POLICIES' 
    ELSE 'NO POLICIES' 
  END as status,
  'Should have RLS policies' as expected;

-- 7. Check for any functions that might be called during user creation
SELECT 
  'Functions on auth.users' as test_name,
  COUNT(*) as count,
  'Check for problematic functions' as expected
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_definition LIKE '%auth.users%';

-- 8. Check if there are any foreign key constraints causing issues
SELECT 
  'Foreign key constraints' as test_name,
  COUNT(*) as count,
  'Check for problematic FKs' as expected
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_schema = 'public'
AND constraint_name LIKE '%user%';

-- 9. Test if we can insert into user_roles (this will show the exact error)
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  error_message TEXT;
BEGIN
  -- Try to insert a test record
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (test_user_id, 'client');
  
  RAISE NOTICE 'user_roles insert test: SUCCESS';
  
  -- Clean up
  DELETE FROM public.user_roles WHERE user_id = test_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    error_message := SQLERRM;
    RAISE NOTICE 'user_roles insert test: FAILED - %', error_message;
END $$;
