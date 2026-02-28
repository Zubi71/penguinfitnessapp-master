-- Test script to verify weight and reps saving functionality

-- 1. Check if set_progress table exists and has correct structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'set_progress'
ORDER BY ordinal_position;

-- 2. Check if clients have user_id field
SELECT 
  COUNT(*) as total_clients,
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as clients_with_user_id,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as clients_without_user_id
FROM clients;

-- 3. Check if RLS policies are in place
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
WHERE tablename = 'set_progress'
ORDER BY policyname;

-- 4. Check existing set_progress records
SELECT 
  COUNT(*) as total_set_progress_records,
  COUNT(DISTINCT exercise_id) as unique_exercises,
  COUNT(DISTINCT client_id) as unique_clients,
  COUNT(DISTINCT trainer_id) as unique_trainers
FROM set_progress;

-- 5. Check exercises with YouTube URLs
SELECT 
  COUNT(*) as total_exercises,
  COUNT(CASE WHEN youtube_video_url IS NOT NULL AND youtube_video_url != '' THEN 1 END) as exercises_with_youtube_urls
FROM exercises;

-- 6. Test data insertion (uncomment to add test data)
-- First, get a valid exercise, client, and trainer
/*
WITH test_data AS (
  SELECT 
    e.id as exercise_id,
    e.training_day_id,
    tp.client_id,
    c.trainer_id,
    t.id as trainer_record_id
  FROM exercises e
  JOIN training_days td ON e.training_day_id = td.id
  JOIN training_programs tp ON td.cycle_id = tp.id
  JOIN clients c ON tp.client_id = c.id
  JOIN trainers t ON c.trainer_id = t.user_id
  LIMIT 1
)
INSERT INTO set_progress (exercise_id, training_day_id, client_id, trainer_id, set_number, weight, reps)
SELECT 
  exercise_id,
  training_day_id,
  client_id,
  trainer_record_id,
  1 as set_number,
  '50kg' as weight,
  '10' as reps
FROM test_data
ON CONFLICT (exercise_id, training_day_id, client_id, set_number) 
DO UPDATE SET 
  weight = EXCLUDED.weight,
  reps = EXCLUDED.reps,
  updated_at = NOW();
*/

-- 7. Check the test data (if inserted)
SELECT 
  sp.*,
  e.name as exercise_name,
  c.first_name as client_first_name,
  c.last_name as client_last_name,
  t.first_name as trainer_first_name,
  t.last_name as trainer_last_name
FROM set_progress sp
JOIN exercises e ON sp.exercise_id = e.id
JOIN clients c ON sp.client_id = c.id
JOIN trainers t ON sp.trainer_id = t.id
ORDER BY sp.created_at DESC
LIMIT 5;

-- 8. Verify RLS is working by checking policies
SELECT 
  'set_progress' as table_name,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'set_progress'
UNION ALL
SELECT 
  'clients' as table_name,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'clients'
UNION ALL
SELECT 
  'exercises' as table_name,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'exercises';
