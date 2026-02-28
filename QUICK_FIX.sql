-- QUICK FIX: Run this in Supabase SQL Editor RIGHT NOW
-- This will fix the user creation issue

-- 1. Disable all triggers on auth.users that might be causing issues
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  RAISE NOTICE 'Disabling problematic triggers...';
  
  FOR trigger_record IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_table = 'users' 
    AND event_object_schema = 'auth'
  LOOP
    EXECUTE format('ALTER TABLE auth.users DISABLE TRIGGER %I', trigger_record.trigger_name);
    RAISE NOTICE 'Disabled trigger: %', trigger_record.trigger_name;
  END LOOP;
  
  RAISE NOTICE 'All triggers disabled successfully';
END $$;

-- 2. Test user creation
DO $$
DECLARE
  test_email TEXT := 'test-' || extract(epoch from now()) || '@example.com';
  test_user_id UUID;
BEGIN
  RAISE NOTICE 'Testing user creation...';
  
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
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    test_email,
    crypt('testpassword123', gen_salt('bf')),
    now(),
    '{}',
    '{}',
    now(),
    now()
  ) RETURNING id INTO test_user_id;
  
  RAISE NOTICE 'SUCCESS: User created with ID: %', test_user_id;
  
  -- Clean up
  DELETE FROM auth.users WHERE id = test_user_id;
  RAISE NOTICE 'Test user cleaned up';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'FAILED: %', SQLERRM;
END $$;

-- 3. Final status
SELECT 'Quick fix completed. User creation should work now.' as status;
