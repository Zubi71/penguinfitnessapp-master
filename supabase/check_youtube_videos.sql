-- Check if there are any exercises with YouTube video URLs

-- Check all exercises with YouTube URLs
SELECT 
  e.id,
  e.name,
  e.youtube_video_url,
  e.training_day_id,
  td.name as day_name,
  tp.name as program_name,
  c.email as client_email
FROM exercises e
LEFT JOIN training_days td ON e.training_day_id = td.id
LEFT JOIN training_programs tp ON td.cycle_id = tp.id
LEFT JOIN clients c ON tp.client_id = c.id
WHERE e.youtube_video_url IS NOT NULL 
AND e.youtube_video_url != '';

-- Check total count of exercises with YouTube URLs
SELECT 
  COUNT(*) as total_exercises_with_youtube,
  COUNT(CASE WHEN youtube_video_url IS NOT NULL AND youtube_video_url != '' THEN 1 END) as exercises_with_youtube_urls
FROM exercises;

-- Check exercises for a specific training day (replace with actual day ID)
-- SELECT * FROM exercises WHERE training_day_id = '4f81ab78-efe3-45ee-95f8-aa298fd825b4';
