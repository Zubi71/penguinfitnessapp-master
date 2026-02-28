-- Phase 21: Impact and Feedback Loop - Database Schema
-- Simplified implementation: Only 5 core features
-- 1. At-risk clients detection
-- 2. Cancellation reasons tracking
-- 3. Revenue leakage tracking
-- 4. Trainer performance metrics
-- 5. Feedback analysis

-- ============================================================================
-- 1. SYSTEM EVENTS TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.system_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'class_booking_created',
    'class_booking_cancelled',
    'class_booking_rescheduled',
    'trainer_assigned',
    'trainer_replaced',
    'trainer_reassigned',
    'client_inactivity_30',
    'client_inactivity_60',
    'client_inactivity_90',
    'payment_success',
    'payment_failure',
    'package_expired',
    'package_topup',
    'emergency_sop_activated',
    'referral_code_used',
    'referral_converted',
    'marketing_message_sent',
    'client_feedback_submitted',
    'trainer_feedback_submitted',
    'client_at_risk_detected',
    'cancellation_reason_recorded',
    'revenue_leakage_detected'
  )),
  client_id UUID REFERENCES public.client_signups(id) ON DELETE SET NULL,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES public.class_enrollments(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  location TEXT,
  channel TEXT CHECK (channel IN ('admin', 'whatsapp', 'ai_bot', 'web', 'mobile', 'system')),
  outcome_status TEXT CHECK (outcome_status IN ('success', 'failure', 'pending', 'partial')),
  metadata JSONB, -- Flexible JSON for event-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_system_events_type ON public.system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_system_events_client ON public.system_events(client_id);
CREATE INDEX IF NOT EXISTS idx_system_events_trainer ON public.system_events(trainer_id);
CREATE INDEX IF NOT EXISTS idx_system_events_created ON public.system_events(created_at);
CREATE INDEX IF NOT EXISTS idx_system_events_channel ON public.system_events(channel);

-- ============================================================================
-- 2. CANCELLATION REASONS TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cancellation_reasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.system_events(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES public.class_enrollments(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.client_signups(id) ON DELETE CASCADE,
  reason_category TEXT CHECK (reason_category IN (
    'schedule_conflict',
    'illness',
    'weather',
    'trainer_issue',
    'location_issue',
    'pricing',
    'dissatisfaction',
    'other'
  )),
  reason_text TEXT,
  hours_before_class INTEGER, -- How many hours before class was it cancelled
  is_rebooked BOOLEAN DEFAULT false,
  rebooked_to_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cancellation_reasons_category ON public.cancellation_reasons(reason_category);
CREATE INDEX IF NOT EXISTS idx_cancellation_reasons_client ON public.cancellation_reasons(client_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_reasons_class ON public.cancellation_reasons(class_id);

-- ============================================================================
-- 3. AT-RISK CLIENTS TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.at_risk_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.client_signups(id) ON DELETE CASCADE,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) NOT NULL,
  risk_factors JSONB NOT NULL, -- Array of risk factors
  days_inactive INTEGER,
  last_activity_date DATE,
  last_class_date DATE,
  cancellation_count INTEGER DEFAULT 0,
  feedback_sentiment TEXT CHECK (feedback_sentiment IN ('positive', 'neutral', 'negative')),
  package_expiry_date DATE,
  revenue_at_risk DECIMAL(10,2),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_action TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_at_risk_clients_client ON public.at_risk_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_at_risk_clients_level ON public.at_risk_clients(risk_level);
CREATE INDEX IF NOT EXISTS idx_at_risk_clients_active ON public.at_risk_clients(is_active);
CREATE INDEX IF NOT EXISTS idx_at_risk_clients_detected ON public.at_risk_clients(detected_at);

-- ============================================================================
-- 4. REVENUE LEAKAGE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.revenue_leakage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.client_signups(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES public.class_enrollments(id) ON DELETE SET NULL,
  leakage_type TEXT CHECK (leakage_type IN (
    'expired_package',
    'unused_sessions',
    'cancellation_no_show',
    'late_cancellation_fee_not_charged',
    'discount_overuse',
    'refund_issued'
  )) NOT NULL,
  amount_lost DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'SGD',
  description TEXT,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  recovered BOOLEAN DEFAULT false,
  recovery_amount DECIMAL(10,2),
  recovery_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_revenue_leakage_type ON public.revenue_leakage(leakage_type);
CREATE INDEX IF NOT EXISTS idx_revenue_leakage_client ON public.revenue_leakage(client_id);
CREATE INDEX IF NOT EXISTS idx_revenue_leakage_recovered ON public.revenue_leakage(recovered);
CREATE INDEX IF NOT EXISTS idx_revenue_leakage_detected ON public.revenue_leakage(detected_at);

-- ============================================================================
-- 5. AUTOMATED FEEDBACK TRIGGERS (for Feedback Analysis)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.feedback_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'first_lesson_complete',
    'trainer_replacement',
    'emergency_sop_resolved',
    'package_complete',
    'reengagement_attempt',
    'cancellation',
    'at_risk_detected'
  )),
  client_id UUID REFERENCES public.client_signups(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  enrollment_id UUID REFERENCES public.class_enrollments(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.system_events(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('pending', 'sent', 'completed', 'expired', 'skipped')) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  feedback_id UUID REFERENCES public.feedback(id) ON DELETE SET NULL,
  language_preference TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_feedback_triggers_type ON public.feedback_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_feedback_triggers_client ON public.feedback_triggers(client_id);
CREATE INDEX IF NOT EXISTS idx_feedback_triggers_status ON public.feedback_triggers(status);
CREATE INDEX IF NOT EXISTS idx_feedback_triggers_pending ON public.feedback_triggers(status, created_at) WHERE status = 'pending';

-- ============================================================================
-- 6. TRAINER PERFORMANCE METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trainer_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  measurement_period_start DATE NOT NULL,
  measurement_period_end DATE NOT NULL,
  total_classes INTEGER DEFAULT 0,
  completed_classes INTEGER DEFAULT 0,
  cancelled_classes INTEGER DEFAULT 0,
  cancellation_rate DECIMAL(5,2),
  average_attendance_rate DECIMAL(5,2),
  client_satisfaction_score DECIMAL(3,2),
  replacement_success_rate DECIMAL(5,2),
  emergency_sop_responses INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(trainer_id, measurement_period_start, measurement_period_end)
);

CREATE INDEX IF NOT EXISTS idx_trainer_performance_trainer ON public.trainer_performance_metrics(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_performance_period ON public.trainer_performance_metrics(measurement_period_start, measurement_period_end);

-- ============================================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- System Events - Admins can view all, trainers can view their own
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all system events" ON public.system_events;
CREATE POLICY "Admins can view all system events" ON public.system_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Trainers can view their own events" ON public.system_events;
CREATE POLICY "Trainers can view their own events" ON public.system_events
  FOR SELECT USING (
    trainer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'trainer'
    )
  );

DROP POLICY IF EXISTS "System can insert events" ON public.system_events;
CREATE POLICY "System can insert events" ON public.system_events
  FOR INSERT WITH CHECK (true); -- Allow all inserts (function uses SECURITY DEFINER)

-- At-Risk Clients - Admins and trainers can view
ALTER TABLE public.at_risk_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and trainers can view at-risk clients" ON public.at_risk_clients;
CREATE POLICY "Admins and trainers can view at-risk clients" ON public.at_risk_clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

DROP POLICY IF EXISTS "System can insert at-risk clients" ON public.at_risk_clients;
CREATE POLICY "System can insert at-risk clients" ON public.at_risk_clients
  FOR INSERT WITH CHECK (true); -- Allow all inserts (function uses SECURITY DEFINER)

-- Revenue Leakage - Admins only
ALTER TABLE public.revenue_leakage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view revenue leakage" ON public.revenue_leakage;
CREATE POLICY "Admins can view revenue leakage" ON public.revenue_leakage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can insert revenue leakage" ON public.revenue_leakage;
CREATE POLICY "System can insert revenue leakage" ON public.revenue_leakage
  FOR INSERT WITH CHECK (true); -- Allow all inserts (function uses SECURITY DEFINER)

-- System Insights - Admins and trainers can view
ALTER TABLE public.system_insights ENABLE ROW LEVEL SECURITY;


-- Trainer Performance - Admins and trainers can view their own
ALTER TABLE public.trainer_performance_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all trainer performance" ON public.trainer_performance_metrics;
CREATE POLICY "Admins can view all trainer performance" ON public.trainer_performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Trainers can view their own performance" ON public.trainer_performance_metrics;
CREATE POLICY "Trainers can view their own performance" ON public.trainer_performance_metrics
  FOR SELECT USING (trainer_id = auth.uid());

DROP POLICY IF EXISTS "System can insert trainer performance" ON public.trainer_performance_metrics;
CREATE POLICY "System can insert trainer performance" ON public.trainer_performance_metrics
  FOR INSERT WITH CHECK (true); -- Allow all inserts (function uses SECURITY DEFINER)

DROP POLICY IF EXISTS "System can update trainer performance" ON public.trainer_performance_metrics;
CREATE POLICY "System can update trainer performance" ON public.trainer_performance_metrics
  FOR UPDATE USING (true); -- Allow all updates (function uses SECURITY DEFINER)

-- Cancellation Reasons - Admins and trainers can view, system can insert
ALTER TABLE public.cancellation_reasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and trainers can view cancellation reasons" ON public.cancellation_reasons;
CREATE POLICY "Admins and trainers can view cancellation reasons" ON public.cancellation_reasons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

DROP POLICY IF EXISTS "System can insert cancellation reasons" ON public.cancellation_reasons;
CREATE POLICY "System can insert cancellation reasons" ON public.cancellation_reasons
  FOR INSERT WITH CHECK (true); -- Allow all inserts (function uses SECURITY DEFINER)

-- Feedback Triggers - Clients can view their own, system can insert
ALTER TABLE public.feedback_triggers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view their own feedback triggers" ON public.feedback_triggers;
CREATE POLICY "Clients can view their own feedback triggers" ON public.feedback_triggers
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM public.client_signups WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'trainer')
    )
  );

DROP POLICY IF EXISTS "System can insert feedback triggers" ON public.feedback_triggers;
CREATE POLICY "System can insert feedback triggers" ON public.feedback_triggers
  FOR INSERT WITH CHECK (true); -- Allow all inserts (function uses SECURITY DEFINER)

DROP POLICY IF EXISTS "System can update feedback triggers" ON public.feedback_triggers;
CREATE POLICY "System can update feedback triggers" ON public.feedback_triggers
  FOR UPDATE USING (true); -- Allow all updates (function uses SECURITY DEFINER)

-- ============================================================================
-- 8. FUNCTIONS FOR AUTOMATED TRACKING
-- ============================================================================

-- Function to log system events
CREATE OR REPLACE FUNCTION log_system_event(
  p_event_type TEXT,
  p_client_id UUID DEFAULT NULL,
  p_trainer_id UUID DEFAULT NULL,
  p_class_id UUID DEFAULT NULL,
  p_enrollment_id UUID DEFAULT NULL,
  p_payment_id UUID DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_channel TEXT DEFAULT NULL,
  p_outcome_status TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.system_events (
    event_type, client_id, trainer_id, class_id, enrollment_id, payment_id,
    location, channel, outcome_status, metadata
  ) VALUES (
    p_event_type, p_client_id, p_trainer_id, p_class_id, p_enrollment_id, p_payment_id,
    p_location, p_channel, p_outcome_status, p_metadata
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get feedback analysis (bypasses RLS for admin queries)
CREATE OR REPLACE FUNCTION get_feedback_analysis(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  id UUID,
  rating INTEGER,
  text_feedback TEXT,
  ai_sentiment TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  feedback_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.rating,
    f.text_feedback,
    f.ai_sentiment,
    f.created_at,
    f.feedback_type
  FROM public.feedback f
  WHERE f.created_at >= (CURRENT_DATE - p_days)
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect at-risk clients
CREATE OR REPLACE FUNCTION detect_at_risk_clients()
RETURNS TABLE (
  client_id UUID,
  risk_level TEXT,
  risk_factors JSONB,
  days_inactive INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH client_activity AS (
    SELECT 
      cs.id as client_id,
      MAX(a.date) as last_attendance,
      MAX(ce.enrollment_date) as last_enrollment,
      COUNT(DISTINCT CASE WHEN c.status = 'cancelled' THEN c.id END) as cancellation_count,
      CURRENT_DATE - COALESCE(MAX(a.date), MAX(ce.enrollment_date), cs.created_at::date) as days_inactive
    FROM public.client_signups cs
    LEFT JOIN public.attendance a ON a.client_id = cs.id
    LEFT JOIN public.class_enrollments ce ON ce.client_id = cs.id
    LEFT JOIN public.classes c ON c.id = ce.class_id
    WHERE cs.status = 'enrolled'
    GROUP BY cs.id, cs.created_at
  )
  SELECT 
    ca.client_id,
    CASE 
      WHEN ca.days_inactive >= 90 THEN 'critical'
      WHEN ca.days_inactive >= 60 THEN 'high'
      WHEN ca.days_inactive >= 30 THEN 'medium'
      ELSE 'low'
    END as risk_level,
    jsonb_build_object(
      'days_inactive', ca.days_inactive,
      'cancellation_count', ca.cancellation_count,
      'last_attendance', ca.last_attendance,
      'last_enrollment', ca.last_enrollment
    ) as risk_factors,
    ca.days_inactive
  FROM client_activity ca
  WHERE ca.days_inactive >= 30;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.system_events IS 'Tracks all major system actions for impact measurement';
COMMENT ON TABLE public.cancellation_reasons IS 'Tracks cancellation reasons for pattern analysis';
COMMENT ON TABLE public.at_risk_clients IS 'Identifies and tracks clients at risk of churning';
COMMENT ON TABLE public.revenue_leakage IS 'Tracks revenue lost from various sources';
COMMENT ON TABLE public.feedback_triggers IS 'Automated feedback collection triggers for feedback analysis';
COMMENT ON TABLE public.trainer_performance_metrics IS 'Tracks trainer performance metrics';

