-- Add YouTube video URL field to exercises table
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS youtube_video_url TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN exercises.youtube_video_url IS 'YouTube video URL for exercise demonstration or instruction';
