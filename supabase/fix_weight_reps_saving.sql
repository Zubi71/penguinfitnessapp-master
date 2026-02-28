-- Fix weight and reps saving for clients and trainers

-- 1. Ensure set_progress table has correct structure
-- Drop existing table if it has wrong structure
DROP TABLE IF EXISTS set_progress CASCADE;

-- Create set_progress table with correct structure
CREATE TABLE IF NOT EXISTS public.set_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  training_day_id UUID REFERENCES public.training_days(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES public.trainers(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight TEXT,
  reps TEXT,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique combination of exercise, day, client, and set number
  UNIQUE(exercise_id, training_day_id, client_id, set_number)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_set_progress_exercise_id ON public.set_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_training_day_id ON public.set_progress(training_day_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_client_id ON public.set_progress(client_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_trainer_id ON public.set_progress(trainer_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_completed_at ON public.set_progress(completed_at);

-- 3. Enable Row Level Security
ALTER TABLE public.set_progress ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing RLS policies
DROP POLICY IF EXISTS "Trainers can view their client's set progress" ON set_progress;
DROP POLICY IF EXISTS "Trainers can insert their client's set progress" ON set_progress;
DROP POLICY IF EXISTS "Trainers can update their client's set progress" ON set_progress;
DROP POLICY IF EXISTS "Trainers can delete their client's set progress" ON set_progress;
DROP POLICY IF EXISTS "Clients can view their own set progress" ON set_progress;
DROP POLICY IF EXISTS "Trainers can manage set progress" ON set_progress;
DROP POLICY IF EXISTS "Clients can manage their own set progress" ON set_progress;

-- 5. Create new RLS policies for set_progress
-- Trainers can manage set progress for their clients
CREATE POLICY "Trainers can manage set progress" ON set_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = set_progress.client_id 
      AND clients.trainer_id = auth.uid()
    )
  );

-- Clients can manage their own set progress
CREATE POLICY "Clients can manage their own set progress" ON set_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = set_progress.client_id 
      AND clients.user_id = auth.uid()
    )
  );

-- 6. Ensure clients table has user_id field
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- 7. Update existing clients to have user_id based on email match
UPDATE clients 
SET user_id = auth.users.id 
FROM auth.users 
WHERE clients.email = auth.users.email 
AND clients.user_id IS NULL;

-- 8. Ensure all clients have user_roles entries
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT c.user_id, 'client'::app_role
FROM clients c
WHERE c.user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = c.user_id AND ur.role = 'client'
);

-- 9. Create RLS policies for clients table access
-- Drop existing policies on clients table
DROP POLICY IF EXISTS "Clients can view their own data" ON clients;
DROP POLICY IF EXISTS "Trainers can view their clients" ON clients;
DROP POLICY IF EXISTS "Clients can view own client record" ON clients;

-- Create new policies for clients table
-- Clients can view their own client record
CREATE POLICY "Clients can view own client record" ON clients
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Trainers can view their clients
CREATE POLICY "Trainers can view their clients" ON clients
  FOR SELECT USING (
    trainer_id = auth.uid()
  );

-- 10. Create RLS policies for exercises table access
-- Drop existing client access policies on exercises
DROP POLICY IF EXISTS "Clients can view exercises for their training days" ON exercises;
DROP POLICY IF EXISTS "Trainers can manage exercises for their clients" ON exercises;

-- Create new RLS policies for client access to exercises
-- Clients can view exercises for their training days
CREATE POLICY "Clients can view exercises for their training days" ON exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM training_days 
      JOIN training_programs ON training_programs.id = training_days.cycle_id
      JOIN clients ON clients.id = training_programs.client_id
      WHERE training_days.id = exercises.training_day_id 
      AND clients.user_id = auth.uid()
    )
  );

-- Trainers can manage exercises for their clients
CREATE POLICY "Trainers can manage exercises for their clients" ON exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM training_days 
      JOIN training_programs ON training_programs.id = training_days.cycle_id
      JOIN clients ON clients.id = training_programs.client_id
      WHERE training_days.id = exercises.training_day_id 
      AND clients.trainer_id = auth.uid()
    )
  );

-- 11. Add YouTube video URL to exercises table if not exists
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS youtube_video_url TEXT;
COMMENT ON COLUMN exercises.youtube_video_url IS 'YouTube video URL for exercise demonstration or instruction';

-- 12. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_set_progress_updated_at 
  BEFORE UPDATE ON public.set_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Add comments
COMMENT ON TABLE public.set_progress IS 'Tracks individual set progress for exercises in training days';
COMMENT ON COLUMN clients.user_id IS 'References auth.users(id) to link client records to user accounts';

-- 14. Test data insertion (optional - uncomment to add test data)
-- INSERT INTO set_progress (exercise_id, training_day_id, client_id, trainer_id, set_number, weight, reps)
-- SELECT 
--   e.id as exercise_id,
--   e.training_day_id,
--   tp.client_id,
--   c.trainer_id,
--   1 as set_number,
--   '50kg' as weight,
--   '10' as reps
-- FROM exercises e
-- JOIN training_days td ON e.training_day_id = td.id
-- JOIN training_programs tp ON td.cycle_id = tp.id
-- JOIN clients c ON tp.client_id = c.id
-- JOIN trainers t ON c.trainer_id = t.user_id
-- LIMIT 1;

-- 15. Verify the setup
SELECT 
  'set_progress' as table_name,
  COUNT(*) as total_records
FROM set_progress
UNION ALL
SELECT 
  'clients_with_user_id' as table_name,
  COUNT(*) as total_records
FROM clients 
WHERE user_id IS NOT NULL;
