-- Add Sample Data to Community Events
-- Run this after the tables are created

-- Insert sample data for testing
INSERT INTO public.community_events (
  title, 
  description, 
  event_date, 
  start_time, 
  end_time, 
  location, 
  event_type, 
  difficulty_level, 
  price, 
  status
) VALUES 
(
  'Morning Yoga Session',
  'Start your day with a refreshing yoga session suitable for all levels.',
  CURRENT_DATE + INTERVAL '2 days',
  '07:00:00',
  '08:00:00',
  'Main Studio',
  'workshop',
  'all',
  15.00,
  'active'
),
(
  'HIIT Challenge',
  'High-intensity interval training challenge for intermediate to advanced fitness enthusiasts.',
  CURRENT_DATE + INTERVAL '5 days',
  '18:00:00',
  '19:00:00',
  'Gym Floor',
  'challenge',
  'intermediate',
  20.00,
  'active'
),
(
  'Community Run',
  'Join us for a community 5K run around the neighborhood. All paces welcome!',
  CURRENT_DATE + INTERVAL '7 days',
  '08:00:00',
  '09:30:00',
  'Starting at Gym',
  'social',
  'all',
  0.00,
  'active'
)
ON CONFLICT DO NOTHING;

-- Verify data was inserted
SELECT 
  id,
  title,
  event_date,
  event_type,
  status,
  current_participants
FROM public.community_events 
ORDER BY event_date;
