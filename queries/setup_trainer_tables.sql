-- Create a standalone SQL file that can be run directly in Supabase dashboard
-- or executed through the app

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS body_weight_tracker CASCADE;
DROP TABLE IF EXISTS workout_days CASCADE;
DROP TABLE IF EXISTS training_cycles CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Create clients table for trainer page
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_clients_trainer_id ON clients(trainer_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_status ON clients(status);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Trainers can view their own clients" ON clients
  FOR SELECT USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can insert their own clients" ON clients
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update their own clients" ON clients
  FOR UPDATE USING (auth.uid() = trainer_id);

CREATE POLICY "Trainers can delete their own clients" ON clients
  FOR DELETE USING (auth.uid() = trainer_id);

-- Create training cycles table
CREATE TABLE training_cycles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL, -- Can be UUID or 'personal-use'
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'paused')),
  weeks INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_training_cycles_client_id ON training_cycles(client_id);
CREATE INDEX idx_training_cycles_trainer_id ON training_cycles(trainer_id);

-- Enable RLS for training cycles
ALTER TABLE training_cycles ENABLE ROW LEVEL SECURITY;

-- RLS policies for training cycles
CREATE POLICY "Trainers can manage their training cycles" ON training_cycles
  FOR ALL USING (auth.uid() = trainer_id);

-- Create workout days table
CREATE TABLE workout_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID REFERENCES training_cycles(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  exercises JSONB DEFAULT '[]'::jsonb,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX idx_workout_days_cycle_id ON workout_days(cycle_id);
CREATE INDEX idx_workout_days_week_day ON workout_days(week_number, day_number);

-- Enable RLS for workout days
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout days
CREATE POLICY "Users can manage workout days through their cycles" ON workout_days
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM training_cycles 
      WHERE training_cycles.id = workout_days.cycle_id 
      AND training_cycles.trainer_id = auth.uid()
    )
  );

-- Create body weight tracker table
CREATE TABLE body_weight_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL, -- Can be UUID or 'personal-use'
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(client_id, date)
);

-- Create indexes
CREATE INDEX idx_body_weight_client_id ON body_weight_tracker(client_id);
CREATE INDEX idx_body_weight_trainer_id ON body_weight_tracker(trainer_id);
CREATE INDEX idx_body_weight_date ON body_weight_tracker(date);

-- Enable RLS for body weight tracker
ALTER TABLE body_weight_tracker ENABLE ROW LEVEL SECURITY;

-- RLS policies for body weight tracker
CREATE POLICY "Trainers can manage their clients' body weight data" ON body_weight_tracker
  FOR ALL USING (auth.uid() = trainer_id);

-- Update function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_cycles_updated_at BEFORE UPDATE ON training_cycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_days_updated_at BEFORE UPDATE ON workout_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_body_weight_tracker_updated_at BEFORE UPDATE ON body_weight_tracker
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
