-- Create training_days table for storing individual days within a training cycle week
CREATE TABLE IF NOT EXISTS training_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  day_name TEXT NOT NULL,
  description TEXT,
  is_rest_day BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(cycle_id, week_number, day_number)
);

-- Create exercises table for storing individual exercises within a training day
CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  training_day_id UUID REFERENCES training_days(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_order INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  sets INTEGER,
  reps TEXT, -- Can be numbers or ranges like "8-12"
  weight TEXT, -- Can include units like "60kg" or "bodyweight"
  rest_time TEXT, -- e.g., "60s", "2min"
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE training_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for training_days
CREATE POLICY "Trainers can manage their own training days" ON training_days
  FOR ALL USING (auth.uid() = trainer_id);

-- Create RLS policies for exercises
CREATE POLICY "Trainers can manage their own exercises" ON exercises
  FOR ALL USING (auth.uid() = trainer_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_days_cycle_week ON training_days(cycle_id, week_number);
CREATE INDEX IF NOT EXISTS idx_exercises_training_day ON exercises(training_day_id);
CREATE INDEX IF NOT EXISTS idx_exercises_order ON exercises(training_day_id, exercise_order);
