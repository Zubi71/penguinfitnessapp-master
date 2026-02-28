-- COMPREHENSIVE FIX for all database issues - WEIGHT AND REPS SAVING

-- 1. DROP AND RECREATE set_progress table with correct structure
DROP TABLE IF EXISTS set_progress CASCADE;

CREATE TABLE public.set_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  exercise_id UUID NOT NULL,
  training_day_id UUID NOT NULL,
  client_id UUID NOT NULL,
  trainer_id UUID,
  set_number INTEGER NOT NULL,
  weight TEXT,
  reps TEXT,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT fk_set_progress_exercise FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
  CONSTRAINT fk_set_progress_training_day FOREIGN KEY (training_day_id) REFERENCES training_days(id) ON DELETE CASCADE,
  CONSTRAINT fk_set_progress_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  CONSTRAINT fk_set_progress_trainer FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE CASCADE,
  
  -- Unique constraint
  CONSTRAINT unique_set_progress UNIQUE(exercise_id, training_day_id, client_id, set_number)
);

-- 2. Create indexes for performance
CREATE INDEX idx_set_progress_exercise_id ON set_progress(exercise_id);
CREATE INDEX idx_set_progress_training_day_id ON set_progress(training_day_id);
CREATE INDEX idx_set_progress_client_id ON set_progress(client_id);
CREATE INDEX idx_set_progress_trainer_id ON set_progress(trainer_id);
CREATE INDEX idx_set_progress_completed_at ON set_progress(completed_at);
CREATE INDEX idx_set_progress_exercise_client_set ON set_progress(exercise_id, training_day_id, client_id, set_number);

-- 3. Enable RLS
ALTER TABLE set_progress ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for set_progress
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

-- 5. Ensure clients table has user_id field
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- 6. Update existing clients to have user_id based on email match
UPDATE clients 
SET user_id = auth.users.id 
FROM auth.users 
WHERE clients.email = auth.users.email 
AND clients.user_id IS NULL;

-- 7. Ensure all clients have user_roles entries
INSERT INTO user_roles (user_id, role)
SELECT DISTINCT c.user_id, 'client'::app_role
FROM clients c
WHERE c.user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = c.user_id AND ur.role = 'client'
);

-- 8. Create RLS policies for clients table
DROP POLICY IF EXISTS "Clients can view own client record" ON clients;
DROP POLICY IF EXISTS "Trainers can view their clients" ON clients;

CREATE POLICY "Clients can view own client record" ON clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Trainers can view their clients" ON clients
  FOR SELECT USING (trainer_id = auth.uid());

-- 9. Create RLS policies for exercises table
DROP POLICY IF EXISTS "Clients can view exercises for their training days" ON exercises;
DROP POLICY IF EXISTS "Trainers can manage exercises for their clients" ON exercises;

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

-- 10. Add YouTube video URL to exercises table
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS youtube_video_url TEXT;
COMMENT ON COLUMN exercises.youtube_video_url IS 'YouTube video URL for exercise demonstration or instruction';

-- 11. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_set_progress_updated_at 
  BEFORE UPDATE ON set_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Add comments
COMMENT ON TABLE set_progress IS 'Tracks individual set progress for exercises in training days';
COMMENT ON COLUMN clients.user_id IS 'References auth.users(id) to link client records to user accounts';

-- 13. Insert test data to verify everything works
-- Get a valid exercise, client, and trainer for testing
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

-- 14. Verify the setup
SELECT 
  'set_progress' as table_name,
  COUNT(*) as total_records
FROM set_progress
UNION ALL
SELECT 
  'clients_with_user_id' as table_name,
  COUNT(*) as total_records
FROM clients 
WHERE user_id IS NOT NULL
UNION ALL
SELECT 
  'exercises_with_youtube' as table_name,
  COUNT(*) as total_records
FROM exercises 
WHERE youtube_video_url IS NOT NULL AND youtube_video_url != '';

-- 15. Show sample data for verification
SELECT 
  'sample_set_progress' as check_name,
  COUNT(*) as count
FROM set_progress
UNION ALL
SELECT 
  'sample_clients' as check_name,
  COUNT(*) as count
FROM clients
WHERE user_id IS NOT NULL
UNION ALL
SELECT 
  'sample_exercises' as check_name,
  COUNT(*) as count
FROM exercises;

-- 16. Show RLS policies
SELECT 
  'rls_policies' as check_name,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename IN ('set_progress', 'clients', 'exercises');
