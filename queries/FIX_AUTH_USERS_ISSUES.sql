-- FIX: Address potential auth.users table issues
-- Run this in Supabase SQL Editor

-- 1. Check if there are any problematic triggers on auth.users
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- 2. Check for any functions that might be failing during user creation
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_definition LIKE '%auth.users%'
AND routine_definition LIKE '%INSERT%';

-- 3. Check if there are any RLS policies on auth.users that might be causing issues
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
WHERE schemaname = 'auth' 
AND tablename = 'users';

-- 4. Check for any constraints on auth.users that might be failing
SELECT 
  constraint_name,
  constraint_type,
  table_name,
  column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'auth' 
AND tc.table_name = 'users';

-- 5. Try to create a test user directly to see the exact error
DO $$
DECLARE
  test_email TEXT := 'test-' || extract(epoch from now()) || '@example.com';
  test_user_id UUID;
  error_message TEXT;
BEGIN
  -- Try to create a user directly in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    test_email,
    crypt('testpassword123', gen_salt('bf')),
    now(),
    null,
    null,
    '{}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO test_user_id;
  
  RAISE NOTICE 'Direct auth.users insert: SUCCESS - User ID: %', test_user_id;
  
  -- Clean up
  DELETE FROM auth.users WHERE id = test_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    error_message := SQLERRM;
    RAISE NOTICE 'Direct auth.users insert: FAILED - %', error_message;
END $$;

-- 6. Check if the issue is with the user_roles table insertion
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  error_message TEXT;
BEGIN
  -- First create a test user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    test_user_id,
    'authenticated',
    'authenticated',
    'test-' || extract(epoch from now()) || '@example.com',
    crypt('testpassword123', gen_salt('bf')),
    now(),
    '{}',
    '{}',
    now(),
    now()
  );
  
  -- Now try to insert into user_roles
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (test_user_id, 'client');
  
  RAISE NOTICE 'user_roles insertion: SUCCESS';
  
  -- Clean up
  DELETE FROM public.user_roles WHERE user_id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    error_message := SQLERRM;
    RAISE NOTICE 'user_roles insertion: FAILED - %', error_message;
    
    -- Clean up on error
    DELETE FROM auth.users WHERE id = test_user_id;
END $$;
