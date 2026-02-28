-- Create set_progress table for tracking workout progress
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_set_progress_exercise_id ON public.set_progress(exercise_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_training_day_id ON public.set_progress(training_day_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_client_id ON public.set_progress(client_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_trainer_id ON public.set_progress(trainer_id);
CREATE INDEX IF NOT EXISTS idx_set_progress_completed_at ON public.set_progress(completed_at);

-- Enable Row Level Security
ALTER TABLE public.set_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Trainers can view their client's set progress" ON public.set_progress
  FOR SELECT USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert their client's set progress" ON public.set_progress
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their client's set progress" ON public.set_progress
  FOR UPDATE USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete their client's set progress" ON public.set_progress
  FOR DELETE USING (auth.uid() = trainer_id);

-- Clients can view their own progress
CREATE POLICY "Clients can view their own set progress" ON public.set_progress
  FOR SELECT USING (auth.uid() = client_id);

-- Create trigger for updated_at
CREATE TRIGGER update_set_progress_updated_at 
  BEFORE UPDATE ON public.set_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.set_progress IS 'Tracks individual set progress for exercises in training days'; 