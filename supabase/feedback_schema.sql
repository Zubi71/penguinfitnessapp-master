-- Feedback System Database Schema

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.client_signups(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.training_sessions(id) ON DELETE SET NULL,
  feedback_type TEXT DEFAULT 'voice' CHECK (feedback_type IN ('voice', 'text', 'rating')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  text_feedback TEXT,
  voice_recording_url TEXT,
  voice_duration_seconds INTEGER,
  ai_processed_feedback TEXT,
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
  ai_key_points TEXT[], -- Array of key points extracted by AI
  ai_recommendations TEXT[], -- Array of recommendations from AI
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'sent_to_admin')),
  admin_email_sent BOOLEAN DEFAULT FALSE,
  admin_email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback_settings table for admin configuration
CREATE TABLE IF NOT EXISTS public.feedback_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default feedback settings
INSERT INTO public.feedback_settings (setting_key, setting_value, description) VALUES
('voice_recording_enabled', 'true', 'Enable voice recording feature'),
('ai_processing_enabled', 'true', 'Enable AI processing of voice feedback'),
('admin_email_enabled', 'true', 'Send processed feedback to admin via email'),
('admin_email_address', '"admin@penguinfitness.com"', 'Admin email address for feedback notifications'),
('voice_max_duration', '300', 'Maximum voice recording duration in seconds (5 minutes)'),
('feedback_reminder_delay', '3600', 'Delay in seconds before sending feedback reminder after class (1 hour)')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for feedback table
CREATE POLICY "Clients can create their own feedback" ON public.feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_signups 
      WHERE id = client_id 
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Clients can view their own feedback" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_signups 
      WHERE id = client_id 
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Trainers can view feedback for their classes/sessions" ON public.feedback
  FOR SELECT USING (
    trainer_id = auth.uid() OR
    class_id IN (SELECT id FROM public.classes WHERE instructor_id = auth.uid()) OR
    session_id IN (SELECT id FROM public.training_sessions WHERE trainer_id = auth.uid()) OR
    client_id IN (
      SELECT id FROM public.client_signups 
      WHERE trainer_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all feedback" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update feedback status" ON public.feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for feedback_settings table
CREATE POLICY "Admins can manage feedback settings" ON public.feedback_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_client_id ON public.feedback(client_id);
CREATE INDEX IF NOT EXISTS idx_feedback_trainer_id ON public.feedback(trainer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_class_id ON public.feedback(class_id);
CREATE INDEX IF NOT EXISTS idx_feedback_session_id ON public.feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for feedback table
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- Create function to send feedback reminder after class
CREATE OR REPLACE FUNCTION send_feedback_reminder()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be handled by the application logic
  -- The trigger just ensures we can track when feedback should be requested
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attendance to potentially trigger feedback reminder
CREATE TRIGGER attendance_feedback_reminder
  AFTER INSERT ON public.attendance
  FOR EACH ROW
  WHEN (NEW.status = 'present')
  EXECUTE FUNCTION send_feedback_reminder();
