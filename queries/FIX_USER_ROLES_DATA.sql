-- Fix User Roles Data Issues
-- This script addresses the "multiple (or no) rows returned" error

-- 1. First, let's see what's in the user_roles table
DO $$
DECLARE
  duplicate_count INTEGER;
  missing_users_count INTEGER;
  total_users INTEGER;
  total_roles INTEGER;
BEGIN
  -- Count duplicates
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, COUNT(*) as role_count
    FROM public.user_roles
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  -- Count users without roles
  SELECT COUNT(*) INTO missing_users_count
  FROM auth.users au
  LEFT JOIN public.user_roles ur ON au.id = ur.user_id
  WHERE ur.user_id IS NULL;
  
  -- Count total users and roles
  SELECT COUNT(*) INTO total_users FROM auth.users;
  SELECT COUNT(*) INTO total_roles FROM public.user_roles;
  
  RAISE NOTICE '=== Current State ===';
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Total role entries: %', total_roles;
  RAISE NOTICE 'Users with duplicate roles: %', duplicate_count;
  RAISE NOTICE 'Users without roles: %', missing_users_count;
END $$;

-- 2. Clean up duplicate roles (keep the most recent one)
DO $$
DECLARE
  duplicate_user RECORD;
  kept_role_id BIGINT;
  deleted_count INTEGER := 0;
BEGIN
  -- Find users with duplicate roles
  FOR duplicate_user IN 
    SELECT user_id, COUNT(*) as role_count
    FROM public.user_roles
    GROUP BY user_id
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the role with the highest ID (most recent)
    SELECT id INTO kept_role_id
    FROM public.user_roles
    WHERE user_id = duplicate_user.user_id
    ORDER BY id DESC
    LIMIT 1;
    
    -- Delete all other roles for this user
    DELETE FROM public.user_roles
    WHERE user_id = duplicate_user.user_id
    AND id != kept_role_id;
    
    deleted_count := deleted_count + 1;
    RAISE NOTICE 'Cleaned up duplicate roles for user: %', duplicate_user.user_id;
  END LOOP;
  
  RAISE NOTICE 'Cleaned up % users with duplicate roles', deleted_count;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error cleaning duplicates: %', SQLERRM;
END $$;

-- 3. Assign roles to users without roles
DO $$
DECLARE
  user_record RECORD;
  assigned_count INTEGER := 0;
BEGIN
  -- Find users without roles and assign them client role
  FOR user_record IN 
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN public.user_roles ur ON au.id = ur.user_id
    WHERE ur.user_id IS NULL
  LOOP
    -- Insert client role for this user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_record.id, 'client')
    ON CONFLICT (user_id) DO NOTHING;
    
    assigned_count := assigned_count + 1;
    RAISE NOTICE 'Assigned client role to user: %', user_record.email;
  END LOOP;
  
  RAISE NOTICE 'Assigned roles to % users', assigned_count;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error assigning roles: %', SQLERRM;
END $$;

-- 4. Ensure we have at least one admin
DO $$
DECLARE
  admin_count INTEGER;
  first_user_id UUID;
BEGIN
  -- Count existing admins
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';
  
  IF admin_count = 0 THEN
    -- Get the first user
    SELECT id INTO first_user_id
    FROM auth.users
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
      -- Update their role to admin
      UPDATE public.user_roles
      SET role = 'admin', updated_at = NOW()
      WHERE user_id = first_user_id;
      
      RAISE NOTICE 'Assigned admin role to first user: %', first_user_id;
    END IF;
  ELSE
    RAISE NOTICE 'Admin user already exists';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error ensuring admin: %', SQLERRM;
END $$;

-- 5. Add constraints to prevent future duplicates
DO $$
BEGIN
  -- Ensure unique constraint on user_id
  ALTER TABLE public.user_roles 
  DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
  
  ALTER TABLE public.user_roles 
  ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
  
  RAISE NOTICE 'Added unique constraint on user_id';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error adding constraint: %', SQLERRM;
END $$;

-- 6. Final verification
DO $$
DECLARE
  final_duplicate_count INTEGER;
  final_missing_count INTEGER;
  final_total_users INTEGER;
  final_total_roles INTEGER;
  admin_count INTEGER;
BEGIN
  -- Count duplicates
  SELECT COUNT(*) INTO final_duplicate_count
  FROM (
    SELECT user_id, COUNT(*) as role_count
    FROM public.user_roles
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  -- Count users without roles
  SELECT COUNT(*) INTO final_missing_count
  FROM auth.users au
  LEFT JOIN public.user_roles ur ON au.id = ur.user_id
  WHERE ur.user_id IS NULL;
  
  -- Count totals
  SELECT COUNT(*) INTO final_total_users FROM auth.users;
  SELECT COUNT(*) INTO final_total_roles FROM public.user_roles;
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  
  RAISE NOTICE '=== Final State ===';
  RAISE NOTICE 'Total users: %', final_total_users;
  RAISE NOTICE 'Total role entries: %', final_total_roles;
  RAISE NOTICE 'Users with duplicate roles: %', final_duplicate_count;
  RAISE NOTICE 'Users without roles: %', final_missing_count;
  RAISE NOTICE 'Admin users: %', admin_count;
  
  IF final_duplicate_count = 0 AND final_missing_count = 0 AND admin_count > 0 THEN
    RAISE NOTICE '✅ User roles data is now clean and consistent!';
  ELSE
    RAISE NOTICE '⚠️  Some issues may still exist';
  END IF;
END $$;

