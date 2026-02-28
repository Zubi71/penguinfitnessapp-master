-- Add client access policies for training data
-- This allows clients to view their assigned training programs and exercises

-- Add client access policy for training_programs
CREATE POLICY "Clients can view their assigned programs" ON training_programs
  FOR SELECT USING (auth.uid() = client_id);

-- Add client access policy for training_days
CREATE POLICY "Clients can view training days for their programs" ON training_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM training_programs 
      WHERE training_programs.id = training_days.cycle_id 
      AND training_programs.client_id = auth.uid()
    )
  );

-- Add client access policy for exercises
CREATE POLICY "Clients can view exercises for their training days" ON exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM training_days 
      JOIN training_programs ON training_programs.id = training_days.cycle_id
      WHERE training_days.id = exercises.training_day_id 
      AND training_programs.client_id = auth.uid()
    )
  );

-- Also add policies for clients to view their own training data
CREATE POLICY "Clients can view their own training programs" ON training_programs
  FOR SELECT USING (
    client_id = auth.uid()
  );
