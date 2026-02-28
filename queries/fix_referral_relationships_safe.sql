-- Simple fix for referral system foreign key relationships
-- This version only adds constraints if they don't already exist

-- Add foreign key relationship between referral_codes and profiles (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'referral_codes_user_id_fkey' 
                   AND table_name = 'referral_codes') THEN
        ALTER TABLE public.referral_codes 
        ADD CONSTRAINT referral_codes_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key relationship between referral_tracking and profiles for referrer (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'referral_tracking_referrer_id_fkey' 
                   AND table_name = 'referral_tracking') THEN
        ALTER TABLE public.referral_tracking 
        ADD CONSTRAINT referral_tracking_referrer_id_fkey 
        FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key relationship between referral_tracking and profiles for referred user (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'referral_tracking_referred_user_id_fkey' 
                   AND table_name = 'referral_tracking') THEN
        ALTER TABLE public.referral_tracking 
        ADD CONSTRAINT referral_tracking_referred_user_id_fkey 
        FOREIGN KEY (referred_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key relationship between referral_analytics and profiles (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'referral_analytics_user_id_fkey' 
                   AND table_name = 'referral_analytics') THEN
        ALTER TABLE public.referral_analytics 
        ADD CONSTRAINT referral_analytics_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO service_role;
