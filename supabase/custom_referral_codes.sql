-- Custom Referral Code System
-- This adds functionality for users to create their own custom referral codes

-- 1. Function to validate custom referral code format (SIMPLIFIED)
CREATE OR REPLACE FUNCTION public.validate_custom_referral_code_format(p_code TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if code is provided
  IF p_code IS NULL OR p_code = '' THEN
    RETURN QUERY SELECT FALSE, 'Referral code cannot be empty';
    RETURN;
  END IF;
  
  -- Check minimum length (at least 4 characters)
  IF LENGTH(p_code) < 4 THEN
    RETURN QUERY SELECT FALSE, 'Referral code must be at least 4 characters long';
    RETURN;
  END IF;
  
  -- Check maximum length (max 50 characters)
  IF LENGTH(p_code) > 50 THEN
    RETURN QUERY SELECT FALSE, 'Referral code cannot exceed 50 characters';
    RETURN;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT TRUE, 'Valid referral code format';
END;
$$;

-- 2. Function to check if custom referral code is unique
CREATE OR REPLACE FUNCTION public.check_custom_referral_code_unique(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  code_exists BOOLEAN;
BEGIN
  -- Check if code already exists (case insensitive)
  SELECT EXISTS(
    SELECT 1 FROM public.referral_codes 
    WHERE LOWER(code) = LOWER(p_code)
  ) INTO code_exists;
  
  RETURN NOT code_exists;
END;
$$;

-- 3. Function to create custom referral code
CREATE OR REPLACE FUNCTION public.create_custom_referral_code(
  p_user_id UUID,
  p_custom_code TEXT,
  p_max_uses INTEGER DEFAULT NULL,
  p_points_per_referral INTEGER DEFAULT 100,
  p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  referral_code_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  format_validation RECORD;
  is_unique BOOLEAN;
  new_code_id UUID;
BEGIN
  -- Validate custom code format
  SELECT * INTO format_validation FROM public.validate_custom_referral_code_format(p_custom_code);
  
  IF NOT format_validation.is_valid THEN
    RETURN QUERY SELECT FALSE, format_validation.error_message, NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if code is unique
  SELECT public.check_custom_referral_code_unique(p_custom_code) INTO is_unique;
  
  IF NOT is_unique THEN
    RETURN QUERY SELECT FALSE, 'This referral code is already taken. Please choose a different one.', NULL::UUID;
    RETURN;
  END IF;
  
  -- Validate other parameters
  IF p_max_uses IS NOT NULL AND (p_max_uses < 1 OR p_max_uses > 1000) THEN
    RETURN QUERY SELECT FALSE, 'Max uses must be between 1 and 1000', NULL::UUID;
    RETURN;
  END IF;
  
  IF p_points_per_referral < 1 OR p_points_per_referral > 10000 THEN
    RETURN QUERY SELECT FALSE, 'Points per referral must be between 1 and 10000', NULL::UUID;
    RETURN;
  END IF;
  
  -- Create the referral code
  INSERT INTO public.referral_codes (
    user_id,
    code,
    max_uses,
    points_per_referral,
    expires_at
  ) VALUES (
    p_user_id,
    LOWER(p_custom_code), -- Store in lowercase for consistency
    p_max_uses,
    p_points_per_referral,
    p_expires_at
  ) RETURNING id INTO new_code_id;
  
  RETURN QUERY SELECT TRUE, 'Custom referral code created successfully', new_code_id;
END;
$$;

-- 4. Function to suggest alternative codes if the requested one is taken
CREATE OR REPLACE FUNCTION public.suggest_alternative_codes(p_base_code TEXT, p_count INTEGER DEFAULT 5)
RETURNS TABLE(
  suggested_code TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  i INTEGER;
  suggestion TEXT;
  is_unique BOOLEAN;
BEGIN
  -- Try variations of the base code
  FOR i IN 1..p_count LOOP
    -- Add numbers to the end
    suggestion := LOWER(p_base_code || i::TEXT);
    
    -- Check if this suggestion is unique
    SELECT public.check_custom_referral_code_unique(suggestion) INTO is_unique;
    
    IF is_unique THEN
      RETURN QUERY SELECT suggestion;
    END IF;
    
    -- Try with random 2-digit number
    suggestion := LOWER(p_base_code || LPAD((RANDOM() * 99)::INTEGER::TEXT, 2, '0'));
    
    SELECT public.check_custom_referral_code_unique(suggestion) INTO is_unique;
    
    IF is_unique THEN
      RETURN QUERY SELECT suggestion;
    END IF;
  END LOOP;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.validate_custom_referral_code_format(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_custom_referral_code_unique(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_custom_referral_code(UUID, TEXT, INTEGER, INTEGER, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.suggest_alternative_codes(TEXT, INTEGER) TO authenticated;
