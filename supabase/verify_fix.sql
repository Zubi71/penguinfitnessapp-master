-- VERIFICATION SCRIPT - Check if weight and reps saving is working

-- 1. Check if set_progress table exists and has correct structure
SELECT 
  'set_progress_table' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'set_progress' AND table_schema = 'public') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status
UNION ALL
SELECT 
  'set_progress_columns' as check_name,
  COUNT(*)::text as status
FROM information_schema.columns 
WHERE table_name = 'set_progress' AND table_schema = 'public';

-- 2. Check if clients have user_id field
SELECT 
  'clients_with_user_id' as check_name,
  COUNT(*)::text as status
FROM clients 
WHERE user_id IS NOT NULL
UNION ALL
SELECT 
  'clients_without_user_id' as check_name,
  COUNT(*)::text as status
FROM clients 
WHERE user_id IS NULL;

-- 3. Check RLS policies on set_progress
SELECT 
  'set_progress_policies' as check_name,
  COUNT(*)::text as status
FROM pg_policies 
WHERE tablename = 'set_progress'
UNION ALL
SELECT 
  'clients_policies' as check_name,
  COUNT(*)::text as status
FROM pg_policies 
WHERE tablename = 'clients'
UNION ALL
SELECT 
  'exercises_policies' as check_name,
  COUNT(*)::text as status
FROM pg_policies 
WHERE tablename = 'exercises';

-- 4. Check existing set_progress records
SELECT 
  'set_progress_records' as check_name,
  COUNT(*)::text as status
FROM set_progress
UNION ALL
SELECT 
  'unique_exercises_with_progress' as check_name,
  COUNT(DISTINCT exercise_id)::text as status
FROM set_progress
UNION ALL
SELECT 
  'unique_clients_with_progress' as check_name,
  COUNT(DISTINCT client_id)::text as status
FROM set_progress;

-- 5. Check exercises with YouTube URLs
SELECT 
  'exercises_with_youtube' as check_name,
  COUNT(*)::text as status
FROM exercises 
WHERE youtube_video_url IS NOT NULL AND youtube_video_url != ''
UNION ALL
SELECT 
  'total_exercises' as check_name,
  COUNT(*)::text as status
FROM exercises;

-- 6. Sample data from set_progress (if any exists)
SELECT 
  'sample_set_progress' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM set_progress LIMIT 1) 
    THEN 'HAS_DATA' 
    ELSE 'NO_DATA' 
  END as status;

-- 7. Check if trainers table has correct structure
SELECT 
  'trainers_table' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trainers' AND table_schema = 'public') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- 8. Check if user_roles table has client entries
SELECT 
  'user_roles_clients' as check_name,
  COUNT(*)::text as status
FROM user_roles 
WHERE role = 'client';

-- 9. Test data insertion (if no data exists)
DO $$
BEGIN
  -- Only insert test data if no set_progress records exist
  IF NOT EXISTS (SELECT 1 FROM set_progress LIMIT 1) THEN
    -- Insert test data
    INSERT INTO set_progress (exercise_id, training_day_id, client_id, trainer_id, set_number, weight, reps)
    SELECT 
      e.id as exercise_id,
      e.training_day_id,
      tp.client_id,
      t.id as trainer_id,
      1 as set_number,
      '50kg' as weight,
      '10' as reps
    FROM exercises e
    JOIN training_days td ON e.training_day_id = td.id
    JOIN training_programs tp ON td.cycle_id = tp.id
    JOIN clients c ON tp.client_id = c.id
    JOIN trainers t ON c.trainer_id = t.user_id
    LIMIT 1;
    
    RAISE NOTICE 'Test data inserted successfully';
  ELSE
    RAISE NOTICE 'Test data already exists, skipping insertion';
  END IF;
END $$;

-- 10. Final verification - show sample data
SELECT 
  'final_verification' as check_name,
  'COMPLETE' as status;
