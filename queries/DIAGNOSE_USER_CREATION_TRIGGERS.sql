-- DIAGNOSE USER CREATION TRIGGERS
-- This will help us find what's trying to access client_points during user creation

-- 1. Check all triggers on auth.users table
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement,
  action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth'
ORDER BY trigger_name;

-- 2. Check all functions that mention client_points
SELECT 
  routine_name, 
  routine_type,
  routine_definition 
FROM information_schema.routines 
WHERE routine_definition ILIKE '%client_points%' 
AND routine_schema IN ('public', 'auth')
ORDER BY routine_name;

-- 3. Check all policies that might reference client_points
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename ILIKE '%client%' OR tablename ILIKE '%points%'
ORDER BY tablename, policyname;

-- 4. Check if there are any database-level triggers
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND action_statement ILIKE '%client_points%'
ORDER BY trigger_name;

-- 5. Check for any stored procedures or functions that run on user creation
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE prosrc ILIKE '%client_points%'
ORDER BY proname;
