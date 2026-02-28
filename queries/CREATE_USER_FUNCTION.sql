-- Create a function to insert users directly into auth.users
-- This bypasses the problematic auth system

CREATE OR REPLACE FUNCTION create_user_directly(
  user_id UUID,
  user_email TEXT,
  user_password TEXT,
  user_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert directly into auth.users table
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
    user_id,
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    null,
    null,
    '{}',
    user_metadata,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION create_user_directly TO service_role;

-- Test the function
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'test-' || extract(epoch from now()) || '@example.com';
BEGIN
  -- Test the function
  PERFORM create_user_directly(
    test_user_id,
    test_email,
    'testpassword123',
    '{"first_name": "Test", "last_name": "User", "role": "trainer"}'::jsonb
  );
  
  RAISE NOTICE 'Function test successful - User created: %', test_user_id;
  
  -- Clean up
  DELETE FROM auth.users WHERE id = test_user_id;
  RAISE NOTICE 'Test user cleaned up';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Function test failed: %', SQLERRM;
END $$;
