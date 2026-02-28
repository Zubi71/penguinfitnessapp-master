-- Referral System Database Schema
-- This creates tables and functions for managing referral codes and tracking

-- 1. Referral Codes Table
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
  current_uses INTEGER DEFAULT 0,
  points_per_referral INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Referral Tracking Table
CREATE TABLE IF NOT EXISTS public.referral_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code_id UUID REFERENCES public.referral_codes(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  points_awarded INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referred_user_id) -- Prevent self-referrals and duplicate referrals
);

-- 3. Referral Analytics Table (for caching analytics data)
CREATE TABLE IF NOT EXISTS public.referral_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON public.referral_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referrer ON public.referral_tracking(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_referred ON public.referral_tracking(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_tracking_status ON public.referral_tracking(status);
CREATE INDEX IF NOT EXISTS idx_referral_analytics_user_id ON public.referral_analytics(user_id);

-- 5. Function to generate unique referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    new_code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    
    -- If code doesn't exist, we can use it
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- 6. Function to create referral code
CREATE OR REPLACE FUNCTION public.create_referral_code(
  p_user_id UUID,
  p_max_uses INTEGER DEFAULT NULL,
  p_points_per_referral INTEGER DEFAULT 100,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code_id UUID;
  new_code TEXT;
BEGIN
  -- Generate unique code
  new_code := public.generate_referral_code();
  
  -- Insert new referral code
  INSERT INTO public.referral_codes (
    user_id,
    code,
    max_uses,
    points_per_referral,
    expires_at
  ) VALUES (
    p_user_id,
    new_code,
    p_max_uses,
    p_points_per_referral,
    p_expires_at
  ) RETURNING id INTO new_code_id;
  
  RETURN new_code_id;
END;
$$;

-- 7. Function to validate referral code
CREATE OR REPLACE FUNCTION public.validate_referral_code(p_code TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  referral_code_id UUID,
  referrer_id UUID,
  points_per_referral INTEGER,
  max_uses INTEGER,
  current_uses INTEGER,
  is_active BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN rc.id IS NULL THEN FALSE
      WHEN NOT rc.is_active THEN FALSE
      WHEN rc.expires_at IS NOT NULL AND rc.expires_at < NOW() THEN FALSE
      WHEN rc.max_uses IS NOT NULL AND rc.current_uses >= rc.max_uses THEN FALSE
      ELSE TRUE
    END as is_valid,
    rc.id as referral_code_id,
    rc.user_id as referrer_id,
    rc.points_per_referral,
    rc.max_uses,
    rc.current_uses,
    rc.is_active,
    rc.expires_at
  FROM public.referral_codes rc
  WHERE rc.code = p_code;
END;
$$;

-- 8. Function to track referral
CREATE OR REPLACE FUNCTION public.track_referral(
  p_referral_code TEXT,
  p_referred_user_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  referral_tracking_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code_data RECORD;
  tracking_id UUID;
  referrer_id UUID;
BEGIN
  -- Validate referral code
  SELECT * INTO code_data FROM public.validate_referral_code(p_referral_code);
  
  IF NOT code_data.is_valid THEN
    RETURN QUERY SELECT FALSE, 'Invalid or expired referral code', NULL::UUID;
    RETURN;
  END IF;
  
  referrer_id := code_data.referrer_id;
  
  -- Check if user is trying to refer themselves
  IF referrer_id = p_referred_user_id THEN
    RETURN QUERY SELECT FALSE, 'Cannot refer yourself', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if referral already exists
  IF EXISTS(
    SELECT 1 FROM public.referral_tracking 
    WHERE referrer_id = referrer_id AND referred_user_id = p_referred_user_id
  ) THEN
    RETURN QUERY SELECT FALSE, 'Referral already exists', NULL::UUID;
    RETURN;
  END IF;
  
  -- Create referral tracking record
  INSERT INTO public.referral_tracking (
    referrer_id,
    referred_user_id,
    referral_code_id
  ) VALUES (
    referrer_id,
    p_referred_user_id,
    code_data.referral_code_id
  ) RETURNING id INTO tracking_id;
  
  -- Update referral code usage count
  UPDATE public.referral_codes
  SET current_uses = current_uses + 1,
      updated_at = NOW()
  WHERE id = code_data.referral_code_id;
  
  RETURN QUERY SELECT TRUE, 'Referral tracked successfully', tracking_id;
END;
$$;

-- 9. Function to complete referral (award points)
CREATE OR REPLACE FUNCTION public.complete_referral(
  p_referral_tracking_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  points_awarded INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tracking_data RECORD;
  points_to_award INTEGER;
BEGIN
  -- Get referral tracking data
  SELECT 
    rt.*,
    rc.points_per_referral
  INTO tracking_data
  FROM public.referral_tracking rt
  JOIN public.referral_codes rc ON rt.referral_code_id = rc.id
  WHERE rt.id = p_referral_tracking_id;
  
  IF tracking_data.id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Referral tracking not found', 0;
    RETURN;
  END IF;
  
  IF tracking_data.status = 'completed' THEN
    RETURN QUERY SELECT FALSE, 'Referral already completed', 0;
    RETURN;
  END IF;
  
  points_to_award := tracking_data.points_per_referral;
  
  -- Update referral status
  UPDATE public.referral_tracking
  SET 
    status = 'completed',
    points_awarded = points_to_award,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_referral_tracking_id;
  
  -- Award points to referrer (integrate with existing points system)
  INSERT INTO public.client_points (
    client_id,
    points,
    source,
    description,
    referral_tracking_id
  ) VALUES (
    tracking_data.referrer_id,
    points_to_award,
    'referral',
    'Points earned from referral',
    p_referral_tracking_id
  );
  
  -- Update analytics
  INSERT INTO public.referral_analytics (
    user_id,
    total_referrals,
    successful_referrals,
    total_points_earned,
    conversion_rate,
    last_updated
  ) VALUES (
    tracking_data.referrer_id,
    1,
    1,
    points_to_award,
    100.00,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_referrals = referral_analytics.total_referrals + 1,
    successful_referrals = referral_analytics.successful_referrals + 1,
    total_points_earned = referral_analytics.total_points_earned + points_to_award,
    conversion_rate = CASE 
      WHEN referral_analytics.total_referrals + 1 > 0 
      THEN (referral_analytics.successful_referrals + 1.0) / (referral_analytics.total_referrals + 1.0) * 100
      ELSE 0
    END,
    last_updated = NOW();
  
  RETURN QUERY SELECT TRUE, 'Referral completed and points awarded', points_to_award;
END;
$$;

-- 10. Function to get user referral analytics
CREATE OR REPLACE FUNCTION public.get_referral_analytics(p_user_id UUID)
RETURNS TABLE(
  total_referrals INTEGER,
  successful_referrals INTEGER,
  pending_referrals INTEGER,
  total_points_earned INTEGER,
  conversion_rate DECIMAL(5,2),
  referral_codes_count INTEGER,
  active_codes_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      (SELECT COUNT(*)::INTEGER FROM public.referral_tracking WHERE referrer_id = p_user_id), 0
    ) as total_referrals,
    COALESCE(
      (SELECT COUNT(*)::INTEGER FROM public.referral_tracking 
       WHERE referrer_id = p_user_id AND status = 'completed'), 0
    ) as successful_referrals,
    COALESCE(
      (SELECT COUNT(*)::INTEGER FROM public.referral_tracking 
       WHERE referrer_id = p_user_id AND status = 'pending'), 0
    ) as pending_referrals,
    COALESCE(
      (SELECT SUM(points_awarded)::INTEGER FROM public.referral_tracking 
       WHERE referrer_id = p_user_id AND status = 'completed'), 0
    ) as total_points_earned,
    COALESCE(
      CASE 
        WHEN (SELECT COUNT(*) FROM public.referral_tracking WHERE referrer_id = p_user_id) > 0 
        THEN (
          (SELECT COUNT(*) FROM public.referral_tracking 
           WHERE referrer_id = p_user_id AND status = 'completed')::DECIMAL / 
          (SELECT COUNT(*) FROM public.referral_tracking WHERE referrer_id = p_user_id)::DECIMAL * 100
        )
        ELSE 0.00
      END, 0.00
    ) as conversion_rate,
    COALESCE(
      (SELECT COUNT(*)::INTEGER FROM public.referral_codes WHERE user_id = p_user_id), 0
    ) as referral_codes_count,
    COALESCE(
      (SELECT COUNT(*)::INTEGER FROM public.referral_codes 
       WHERE user_id = p_user_id AND is_active = TRUE), 0
    ) as active_codes_count;
END;
$$;

-- 11. Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_analytics ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral codes" ON public.referral_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral codes" ON public.referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral codes" ON public.referral_codes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own referral codes" ON public.referral_codes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all referral codes" ON public.referral_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 13. RLS Policies for referral_tracking
CREATE POLICY "Users can view referrals they made" ON public.referral_tracking
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals made to them" ON public.referral_tracking
  FOR SELECT USING (auth.uid() = referred_user_id);

CREATE POLICY "System can create referral tracking" ON public.referral_tracking
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update referral tracking" ON public.referral_tracking
  FOR UPDATE USING (true);

CREATE POLICY "Admins can view all referral tracking" ON public.referral_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 14. RLS Policies for referral_analytics
CREATE POLICY "Users can view their own analytics" ON public.referral_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage analytics" ON public.referral_analytics
  FOR ALL USING (true);

CREATE POLICY "Admins can view all analytics" ON public.referral_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 15. Grant permissions
GRANT ALL ON public.referral_codes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_codes TO authenticated;

GRANT ALL ON public.referral_tracking TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.referral_tracking TO authenticated;

GRANT ALL ON public.referral_analytics TO service_role;
GRANT SELECT ON public.referral_analytics TO authenticated;

-- 16. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.generate_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_referral_code(UUID, INTEGER, INTEGER, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_referral(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_referral(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_analytics(UUID) TO authenticated;

-- 17. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_referral_codes_updated_at 
  BEFORE UPDATE ON public.referral_codes 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referral_tracking_updated_at 
  BEFORE UPDATE ON public.referral_tracking 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 18. Add referral_tracking_id column to client_points if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'client_points' AND column_name = 'referral_tracking_id'
  ) THEN
    ALTER TABLE public.client_points 
    ADD COLUMN referral_tracking_id UUID REFERENCES public.referral_tracking(id);
  END IF;
END $$;

-- 19. Create view for easy referral data access
CREATE OR REPLACE VIEW public.referral_summary AS
SELECT 
  rc.id as referral_code_id,
  rc.user_id as referrer_id,
  rc.code,
  rc.max_uses,
  rc.current_uses,
  rc.points_per_referral,
  rc.is_active,
  rc.expires_at,
  rc.created_at,
  COUNT(rt.id) as total_tracked,
  COUNT(CASE WHEN rt.status = 'completed' THEN 1 END) as successful_referrals,
  COUNT(CASE WHEN rt.status = 'pending' THEN 1 END) as pending_referrals,
  SUM(CASE WHEN rt.status = 'completed' THEN rt.points_awarded ELSE 0 END) as total_points_awarded
FROM public.referral_codes rc
LEFT JOIN public.referral_tracking rt ON rc.id = rt.referral_code_id
GROUP BY rc.id, rc.user_id, rc.code, rc.max_uses, rc.current_uses, 
         rc.points_per_referral, rc.is_active, rc.expires_at, rc.created_at;

-- Grant permissions on the view
GRANT SELECT ON public.referral_summary TO authenticated;
GRANT SELECT ON public.referral_summary TO service_role;

-- 20. Insert sample data for testing (optional)
-- Uncomment the following lines to create sample referral codes for testing

/*
DO $$
DECLARE
  sample_user_id UUID;
BEGIN
  -- Get a sample user ID
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
  
  IF sample_user_id IS NOT NULL THEN
    -- Create a sample referral code
    PERFORM public.create_referral_code(
      sample_user_id,
      10, -- max uses
      100, -- points per referral
      NOW() + INTERVAL '30 days' -- expires in 30 days
    );
    
    RAISE NOTICE 'Sample referral code created for user: %', sample_user_id;
  END IF;
END $$;
*/

RAISE NOTICE 'Referral system database schema created successfully!';
