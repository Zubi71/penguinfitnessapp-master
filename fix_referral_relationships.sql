-- Fix referral system foreign key relationships
-- This adds the missing foreign key relationships between referral tables and profiles
-- Handles existing constraints gracefully

-- Drop existing constraints if they exist, then recreate them
DO $$
BEGIN
    -- Drop existing foreign key constraints if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'referral_codes_user_id_fkey' 
               AND table_name = 'referral_codes') THEN
        ALTER TABLE public.referral_codes DROP CONSTRAINT referral_codes_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'referral_tracking_referrer_id_fkey' 
               AND table_name = 'referral_tracking') THEN
        ALTER TABLE public.referral_tracking DROP CONSTRAINT referral_tracking_referrer_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'referral_tracking_referred_user_id_fkey' 
               AND table_name = 'referral_tracking') THEN
        ALTER TABLE public.referral_tracking DROP CONSTRAINT referral_tracking_referred_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'referral_analytics_user_id_fkey' 
               AND table_name = 'referral_analytics') THEN
        ALTER TABLE public.referral_analytics DROP CONSTRAINT referral_analytics_user_id_fkey;
    END IF;
END $$;

-- Add foreign key relationship between referral_codes and profiles
ALTER TABLE public.referral_codes 
ADD CONSTRAINT referral_codes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key relationship between referral_tracking and profiles for referrer
ALTER TABLE public.referral_tracking 
ADD CONSTRAINT referral_tracking_referrer_id_fkey 
FOREIGN KEY (referrer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key relationship between referral_tracking and profiles for referred user
ALTER TABLE public.referral_tracking 
ADD CONSTRAINT referral_tracking_referred_user_id_fkey 
FOREIGN KEY (referred_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key relationship between referral_analytics and profiles
ALTER TABLE public.referral_analytics 
ADD CONSTRAINT referral_analytics_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Grant necessary permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO service_role;
