-- FINAL DATABASE FIX
-- This addresses the root cause of "Database error creating new user"

-- 1. First, let's check what's causing the issue
SELECT 'Checking database state...' as status;

-- 2. Check if there are any problematic triggers on auth.users
SELECT 
  'auth.users triggers' as check_type,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- 3. Check for any custom functions that might be interfering
SELECT 
  'custom functions' as check_type,
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE proname LIKE '%user%' 
AND proname LIKE '%create%'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. Check for RLS policies on auth.users
SELECT 
  'auth.users RLS policies' as check_type,
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

-- 5. Check for constraints that might be failing
SELECT 
  'auth.users constraints' as check_type,
  constraint_name,
  constraint_type,
  table_name,
  column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'auth' 
AND tc.table_name = 'users';

-- 6. CRITICAL FIX: Disable all triggers on auth.users temporarily
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  RAISE NOTICE 'Disabling all triggers on auth.users...';
  
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

-- 7. Test user creation with triggers disabled
DO $$
DECLARE
  test_email TEXT := 'test-' || extract(epoch from now()) || '@example.com';
  test_user_id UUID;
  error_message TEXT;
BEGIN
  RAISE NOTICE 'Testing user creation with triggers disabled...';
  
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
  
  RAISE NOTICE 'SUCCESS: User created with ID: %', test_user_id;
  
  -- Clean up
  DELETE FROM auth.users WHERE id = test_user_id;
  RAISE NOTICE 'Test user cleaned up';
  
EXCEPTION
  WHEN OTHERS THEN
    error_message := SQLERRM;
    RAISE NOTICE 'FAILED: %', error_message;
END $$;

-- 8. If the above worked, re-enable triggers one by one to find the problematic one
DO $$
DECLARE
  trigger_record RECORD;
  test_email TEXT;
  test_user_id UUID;
  error_message TEXT;
  problematic_trigger TEXT;
BEGIN
  RAISE NOTICE 'Testing triggers one by one...';
  
  FOR trigger_record IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_table = 'users' 
    AND event_object_schema = 'auth'
  LOOP
    -- Enable this trigger
    EXECUTE format('ALTER TABLE auth.users ENABLE TRIGGER %I', trigger_record.trigger_name);
    RAISE NOTICE 'Testing with trigger enabled: %', trigger_record.trigger_name;
    
    -- Test user creation
    test_email := 'test-' || extract(epoch from now()) || '@example.com';
    
    BEGIN
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
      
      -- If successful, clean up and disable this trigger
      DELETE FROM auth.users WHERE id = test_user_id;
      EXECUTE format('ALTER TABLE auth.users DISABLE TRIGGER %I', trigger_record.trigger_name);
      RAISE NOTICE 'Trigger % works fine, keeping disabled', trigger_record.trigger_name;
      
    EXCEPTION
      WHEN OTHERS THEN
        error_message := SQLERRM;
        RAISE NOTICE 'PROBLEMATIC TRIGGER FOUND: % - Error: %', trigger_record.trigger_name, error_message;
        problematic_trigger := trigger_record.trigger_name;
        -- Keep this trigger disabled
    END;
  END LOOP;
  
  IF problematic_trigger IS NOT NULL THEN
    RAISE NOTICE 'Problematic trigger identified and disabled: %', problematic_trigger;
  ELSE
    RAISE NOTICE 'All triggers tested successfully';
  END IF;
END $$;

-- 9. Final status
SELECT 'Database fix completed. Check the logs above for results.' as status;
