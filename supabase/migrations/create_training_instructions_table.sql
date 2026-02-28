-- Create training instructions table
CREATE TABLE IF NOT EXISTS public.training_instructions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_instructions_trainer_id ON training_instructions(trainer_id);
CREATE INDEX IF NOT EXISTS idx_training_instructions_client_id ON training_instructions(client_id);

-- Enable Row Level Security
ALTER TABLE training_instructions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Trainers can manage their own client instructions" ON training_instructions
  FOR ALL USING (auth.uid() = trainer_id);

CREATE POLICY "Clients can view their assigned instructions" ON training_instructions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = training_instructions.client_id 
      AND clients.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_training_instructions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_training_instructions_updated_at 
BEFORE UPDATE ON training_instructions 
FOR EACH ROW EXECUTE FUNCTION update_training_instructions_updated_at();
