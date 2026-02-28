-- Test script to check YouTube URLs in exercises

-- 1. Check if youtube_video_url column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'exercises' AND column_name = 'youtube_video_url';

-- 2. Check all exercises with YouTube URLs
SELECT 
  e.id,
  e.name,
  e.youtube_video_url,
  e.training_day_id,
  td.day_name,
  tp.name as program_name,
  c.email as client_email
FROM exercises e
LEFT JOIN training_days td ON e.training_day_id = td.id
LEFT JOIN training_programs tp ON td.cycle_id = tp.id
LEFT JOIN clients c ON tp.client_id = c.id
WHERE e.youtube_video_url IS NOT NULL 
AND e.youtube_video_url != ''
ORDER BY e.name;

-- 3. Count exercises with YouTube URLs
SELECT 
  COUNT(*) as total_exercises,
  COUNT(CASE WHEN youtube_video_url IS NOT NULL AND youtube_video_url != '' THEN 1 END) as exercises_with_youtube_urls,
  COUNT(CASE WHEN youtube_video_url IS NULL OR youtube_video_url = '' THEN 1 END) as exercises_without_youtube_urls
FROM exercises;

-- 4. Check exercises for a specific training day (replace with your day ID)
-- SELECT * FROM exercises WHERE training_day_id = '4f81ab78-efe3-45ee-95f8-aa298fd825b4';

-- 5. Add a test YouTube URL to an exercise (uncomment and modify as needed)
-- UPDATE exercises 
-- SET youtube_video_url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' 
-- WHERE id = 'your-exercise-id-here';
