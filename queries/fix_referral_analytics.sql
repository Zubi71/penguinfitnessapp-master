-- Fix for referral analytics function
-- This fixes the missing FROM-clause error and return type issues

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
