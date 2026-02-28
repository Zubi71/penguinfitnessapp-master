-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM for roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'trainer', 'client');
  END IF;
END$$;

-- Trainers table (previously instructors)
CREATE TABLE IF NOT EXISTS public.trainers_legacy (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trainers table (new primary table)
CREATE TABLE IF NOT EXISTS public.trainers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Keep instructors table for backward compatibility, but mark as deprecated
CREATE TABLE IF NOT EXISTS public.instructors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  certifications TEXT[],
  specialties TEXT[],
  hourly_rate DECIMAL(10,2),
  bio TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training sessions table (previously classes)
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT DEFAULT 60, -- Default 60 minutes for fitness sessions
  max_capacity INTEGER DEFAULT 1, -- Default to 1-to-1 personal training
  current_enrollment INTEGER DEFAULT 0,
  session_type TEXT DEFAULT 'personal' CHECK (session_type IN ('personal', 'buddy', 'group', 'online')),
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all')),
  price DECIMAL(10,2) NOT NULL,
  location TEXT DEFAULT 'main gym',
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern TEXT, -- daily, weekly, monthly
  recurring_end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT,
  service_type TEXT, -- '1-to-1', 'buddy', 'group', 'online'
  package_type TEXT, -- 'ad-hoc', '10-sessions', '24-sessions', '36-sessions', 'elite-plan'
  sessions_remaining INT DEFAULT 1
);

-- Keep classes table for backward compatibility
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT DEFAULT 45, -- unified duration field
  max_capacity INTEGER DEFAULT 8,
  current_enrollment INTEGER DEFAULT 0,
  class_type TEXT DEFAULT 'group' CHECK (class_type IN ('group', 'private', 'semi-private')),
  level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all')),
  price DECIMAL(10,2) NOT NULL,
  location TEXT DEFAULT 'main pool',
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern TEXT, -- daily, weekly, monthly
  recurring_end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT,
  membership_type TEXT,
  lessons_per_package INT DEFAULT 4
);

-- Client signups table (main client table) - 2-step registration
CREATE TABLE IF NOT EXISTS public.client_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Step 1: Basic Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  birthday DATE,
  gender TEXT,
  -- Step 2: Contact/Registration Details (optional/defaults)
  type_of_lesson TEXT DEFAULT 'Basic Package',
  preferred_days TEXT[] DEFAULT ARRAY['flexible'],
  preferred_start_time TEXT DEFAULT 'flexible',
  location TEXT DEFAULT 'main gym',
  medical_conditions TEXT DEFAULT 'no',
  medical_details TEXT,
  additional_notes TEXT,
  -- Emergency Contact (optional - not required for registration)
  parent_first_name TEXT,
  parent_last_name TEXT,
  parent_relationship TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  same_as_email BOOLEAN DEFAULT FALSE,
  same_as_phone BOOLEAN DEFAULT FALSE,
  -- Registration Flow Control
  registration_step INTEGER DEFAULT 1 CHECK (registration_step IN (1, 2)),
  form_completed BOOLEAN DEFAULT FALSE,
  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'approved', 'enrolled', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Class enrollments table (many-to-many: client <-> class)
CREATE TABLE IF NOT EXISTS public.class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.client_signups(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'suspended')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.client_signups(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.class_enrollments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  check_in_time TIME,
  check_out_time TIME,
  notes TEXT,
  marked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, class_id, date)
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.client_signups(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.class_enrollments(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'SGD',
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online', 'check')),
  payment_type TEXT DEFAULT 'class_fee' CHECK (payment_type IN ('class_fee', 'membership', 'late_fee', 'refund', 'other')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  reference_number TEXT,
  due_date DATE,
  paid_date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES public.client_signups(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES public.class_enrollments(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'SGD',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date DATE NOT NULL,
  issue_date DATE DEFAULT CURRENT_DATE,
  paid_date DATE,
  description TEXT,
  line_items JSONB,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stripe_invoice_id TEXT
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('class_reminder', 'payment_due', 'class_cancelled', 'enrollment_confirmed', 'attendance_marked', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  channels TEXT[] DEFAULT ARRAY['in_app'],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
COMMENT ON TABLE public.user_roles IS 'Application roles for each user.';

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role app_role NOT NULL DEFAULT 'client',
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_signups_email ON public.client_signups(email);
CREATE INDEX IF NOT EXISTS idx_client_signups_registration_step ON public.client_signups(registration_step);
CREATE INDEX IF NOT EXISTS idx_client_signups_form_completed ON public.client_signups(form_completed);
CREATE INDEX IF NOT EXISTS idx_classes_date ON public.classes(date);
CREATE INDEX IF NOT EXISTS idx_classes_instructor_id ON public.classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_client_id ON public.class_enrollments(client_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON public.class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_instructors_updated_at BEFORE UPDATE ON public.instructors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON public.trainers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trainers_legacy_updated_at BEFORE UPDATE ON public.trainers_legacy FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_signups_updated_at BEFORE UPDATE ON public.client_signups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_enrollments_updated_at BEFORE UPDATE ON public.class_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers_legacy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for instructors table
CREATE POLICY "Allow admin and trainer to view all instructors" ON public.instructors FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  ) OR
  user_id = auth.uid()  -- Allow users to view their own instructor record
);

CREATE POLICY "Allow admin and trainer registration to insert instructors" ON public.instructors FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) OR
  user_id = auth.uid()  -- Allow users to insert their own instructor record during registration
);

-- Allow trainer registration to insert instructor records
-- CREATE POLICY "Allow trainer registration to insert own instructor record" ON public.instructors FOR INSERT WITH CHECK (
--   user_id = auth.uid()
-- );

CREATE POLICY "Allow admin to update instructors" ON public.instructors FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Allow admin to delete instructors" ON public.instructors FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- RLS Policies for trainers table
CREATE POLICY "Allow admin and trainer to view all trainers" ON public.trainers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  ) OR
  user_id = auth.uid()  -- Allow users to view their own trainer record
);

CREATE POLICY "Allow admin and trainer registration to insert trainers" ON public.trainers FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) OR
  user_id = auth.uid()  -- Allow users to insert their own trainer record during registration
);

CREATE POLICY "Allow admin to update trainers" ON public.trainers FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Allow admin to delete trainers" ON public.trainers FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- RLS Policies for trainers_legacy table (backward compatibility)
CREATE POLICY "Allow admin and trainer to view all trainers_legacy" ON public.trainers_legacy FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  ) OR
  user_id = auth.uid()  -- Allow users to view their own trainer record
);

CREATE POLICY "Allow admin and trainer registration to insert trainers_legacy" ON public.trainers_legacy FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) OR
  user_id = auth.uid()  -- Allow users to insert their own trainer record during registration
);

CREATE POLICY "Allow admin to update trainers_legacy" ON public.trainers_legacy FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Allow admin to delete trainers_legacy" ON public.trainers_legacy FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- RLS Policies for classes table
CREATE POLICY "Allow admin and trainer to view all classes" ON public.classes FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.class_enrollments ce ON ce.client_id = (
      SELECT id FROM public.client_signups WHERE email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'client'
    AND ce.class_id = public.classes.id
  )
);

CREATE POLICY "Allow admin and trainer to insert classes" ON public.classes FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  )
);

CREATE POLICY "Allow admin and trainer to update classes" ON public.classes FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  )
);

CREATE POLICY "Allow admin to delete classes" ON public.classes FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- RLS Policies for client_signups table
CREATE POLICY "Allow admin and trainer to view all client signups" ON public.client_signups FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  ) OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Allow admin and trainer to insert client signups" ON public.client_signups FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  ) OR
  auth.uid() IS NULL -- Allow anonymous signup
);

CREATE POLICY "Allow admin and trainer to update client signups" ON public.client_signups FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  ) OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Allow admin to delete client signups" ON public.client_signups FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- RLS Policies for class_enrollments table
CREATE POLICY "Allow admin and trainer to view all enrollments" ON public.class_enrollments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.client_signups cs ON cs.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'client'
    AND cs.id = public.class_enrollments.client_id
  )
);

CREATE POLICY "Allow admin and trainer to manage enrollments" ON public.class_enrollments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  )
);

-- RLS Policies for attendance table
CREATE POLICY "Allow admin and trainer to view all attendance" ON public.attendance FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.client_signups cs ON cs.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'client'
    AND cs.id = public.attendance.client_id
  )
);

CREATE POLICY "Allow admin and trainer to manage attendance" ON public.attendance FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  )
);

-- RLS Policies for payments table
CREATE POLICY "Allow admin and trainer to view all payments" ON public.payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.client_signups cs ON cs.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'client'
    AND cs.id = public.payments.client_id
  )
);

CREATE POLICY "Allow admin and trainer to manage payments" ON public.payments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  )
);

-- RLS Policies for invoices table
CREATE POLICY "Allow admin and trainer to view all invoices" ON public.invoices FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  ) OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.client_signups cs ON cs.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'client'
    AND cs.id = public.invoices.client_id
  )
);

CREATE POLICY "Allow admin and trainer to manage invoices" ON public.invoices FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  )
);

-- RLS Policies for user_roles table
-- RLS is disabled for user_roles to avoid infinite recursion
-- API routes use service role key to access this table

-- RLS Policies for profiles table
CREATE POLICY "Allow users to view their own profile" ON public.profiles FOR SELECT USING (
  id = auth.uid()
);

CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (
  id = auth.uid()
);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert their own profile" ON public.profiles FOR INSERT WITH CHECK (
  id = auth.uid()
);

CREATE POLICY "Allow admin to view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Allow settings and notifications to be managed by admin only
CREATE POLICY "Allow admin to manage settings" ON public.settings FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Allow admin and trainer to manage notifications" ON public.notifications FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  )
);

CREATE POLICY "Allow users to view their own notifications" ON public.notifications FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'trainer')
  )
);
