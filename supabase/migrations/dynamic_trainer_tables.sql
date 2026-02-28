-- Add missing columns to clients table for dynamic trainer functionality
ALTER TABLE clients ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update full_name from first_name and last_name where missing
UPDATE clients 
SET full_name = CONCAT(first_name, ' ', COALESCE(last_name, ''))
WHERE full_name IS NULL;

-- Update name column as well
UPDATE clients 
SET name = full_name
WHERE name IS NULL;

-- Create training_programs table (renamed from training_cycles for consistency)
CREATE TABLE IF NOT EXISTS training_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add status column if it doesn't exist (for existing databases)
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused'));

-- Remove duration_weeks column if it exists (since cycles are now open-ended)
ALTER TABLE training_programs DROP COLUMN IF EXISTS duration_weeks;

-- Create workout_sessions table
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  program_id UUID REFERENCES training_programs(id) ON DELETE SET NULL,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  duration_minutes INTEGER,
  notes TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create body_weight_tracker table if it doesn't exist
CREATE TABLE IF NOT EXISTS body_weight_tracker (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT NOT NULL, -- Can be UUID or 'personal-use'
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(client_id, trainer_id, date)
);

-- Enable RLS on all tables
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_weight_tracker ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for training_programs
CREATE POLICY "Trainers can manage their own programs" ON training_programs
  FOR ALL USING (auth.uid() = trainer_id);

-- Create RLS policies for workout_sessions
CREATE POLICY "Trainers can manage their own sessions" ON workout_sessions
  FOR ALL USING (auth.uid() = trainer_id);

-- Create RLS policies for bookings
CREATE POLICY "Trainers can manage their own bookings" ON bookings
  FOR ALL USING (auth.uid() = trainer_id);

-- Create RLS policies for messages
CREATE POLICY "Users can read their own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Create RLS policies for body_weight_tracker
CREATE POLICY "Trainers can manage weight tracking" ON body_weight_tracker
  FOR ALL USING (auth.uid() = trainer_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_programs_trainer_id ON training_programs(trainer_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_trainer_id ON workout_sessions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trainer_id ON bookings(trainer_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_body_weight_tracker_trainer_client ON body_weight_tracker(trainer_id, client_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_programs_updated_at ON training_programs;
CREATE TRIGGER update_training_programs_updated_at BEFORE UPDATE ON training_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workout_sessions_updated_at ON workout_sessions;
CREATE TRIGGER update_workout_sessions_updated_at BEFORE UPDATE ON workout_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_body_weight_tracker_updated_at ON body_weight_tracker;
CREATE TRIGGER update_body_weight_tracker_updated_at BEFORE UPDATE ON body_weight_tracker FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
