-- Trainer Availability Schema
-- This table stores trainer availability by day of week

CREATE TABLE IF NOT EXISTS public.trainer_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trainer_id UUID REFERENCES public.trainers(id) ON DELETE CASCADE NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  -- Time range columns (new approach)
  start_time TIME, -- Start time of availability slot in 24-hour format (NULL means from start of day)
  end_time TIME,   -- End time of availability slot in 24-hour format (NULL means until end of day)
  -- Legacy columns (deprecated, kept for backward compatibility)
  constraint_type TEXT CHECK (constraint_type IN ('before', 'after', 'free')),
  constraint_time TIME, -- Legacy time constraint
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_trainer_availability_trainer_id ON public.trainer_availability(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_availability_day ON public.trainer_availability(day_of_week);

-- Unique constraint for multiple time slots per day
-- Allows same trainer to have multiple time slots on the same day
CREATE UNIQUE INDEX IF NOT EXISTS idx_trainer_availability_unique_slot 
ON public.trainer_availability(
  trainer_id, 
  day_of_week, 
  COALESCE(start_time, '00:00:00'::time), 
  COALESCE(end_time, '23:59:59'::time)
);

-- Enable RLS
ALTER TABLE public.trainer_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Trainers can view and manage their own availability
CREATE POLICY "Trainers can view their own availability"
  ON public.trainer_availability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trainers
      WHERE trainers.id = trainer_availability.trainer_id
      AND trainers.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can insert their own availability"
  ON public.trainer_availability
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trainers
      WHERE trainers.id = trainer_availability.trainer_id
      AND trainers.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can update their own availability"
  ON public.trainer_availability
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trainers
      WHERE trainers.id = trainer_availability.trainer_id
      AND trainers.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can delete their own availability"
  ON public.trainer_availability
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trainers
      WHERE trainers.id = trainer_availability.trainer_id
      AND trainers.user_id = auth.uid()
    )
  );

-- Admins can view all trainer availability
CREATE POLICY "Admins can view all trainer availability"
  ON public.trainer_availability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trainer_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_trainer_availability_updated_at
  BEFORE UPDATE ON public.trainer_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_trainer_availability_updated_at();

COMMENT ON TABLE public.trainer_availability IS 'Stores trainer availability by day of week with time ranges';
COMMENT ON COLUMN public.trainer_availability.start_time IS 'Start time of availability slot in 24-hour format (e.g., 17:00 for 5:00 PM). NULL means available from start of day.';
COMMENT ON COLUMN public.trainer_availability.end_time IS 'End time of availability slot in 24-hour format (e.g., 19:00 for 7:00 PM). NULL means available until end of day.';
COMMENT ON COLUMN public.trainer_availability.constraint_type IS 'DEPRECATED: Legacy column, use start_time and end_time instead';
COMMENT ON COLUMN public.trainer_availability.constraint_time IS 'DEPRECATED: Legacy column, use start_time and end_time instead';

