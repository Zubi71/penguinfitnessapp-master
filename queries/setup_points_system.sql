-- Points and Rewards System Setup
-- Run this in Supabase SQL Editor to create the missing tables

-- Create points table to track client points
CREATE TABLE IF NOT EXISTS client_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points_balance INTEGER DEFAULT 0 NOT NULL,
  total_points_earned INTEGER DEFAULT 0 NOT NULL,
  total_points_spent INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create points transactions table to track all point activities
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'expired', 'bonus')),
  points_amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  reference_type VARCHAR(50) NOT NULL CHECK (reference_type IN ('event_registration', 'class_purchase', 'referral', 'bonus', 'discount_redemption')),
  reference_id UUID, -- ID of the related event, class, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rewards/discounts table
CREATE TABLE IF NOT EXISTS client_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('discount_percentage', 'discount_fixed', 'free_event', 'free_class')),
  reward_value DECIMAL(10,2) NOT NULL, -- Percentage or fixed amount
  description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Stripe payment records table
CREATE TABLE IF NOT EXISTS stripe_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_invoice_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'canceled')),
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('event_registration', 'class_purchase')),
  reference_type VARCHAR(50) NOT NULL,
  reference_id UUID NOT NULL, -- ID of the event or class
  points_earned INTEGER DEFAULT 0,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_points_client_id ON client_points(client_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_client_id ON points_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_client_rewards_client_id ON client_rewards(client_id);
CREATE INDEX IF NOT EXISTS idx_client_rewards_active ON client_rewards(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_stripe_payments_client_id ON stripe_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_status ON stripe_payments(status);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_reference ON stripe_payments(reference_type, reference_id);

-- Enable Row Level Security
ALTER TABLE client_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_points
CREATE POLICY "Users can view their own points" ON client_points
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Users can update their own points" ON client_points
  FOR UPDATE USING (auth.uid() = client_id);

-- RLS Policies for points_transactions
CREATE POLICY "Users can view their own point transactions" ON points_transactions
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "System can insert point transactions" ON points_transactions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for client_rewards
CREATE POLICY "Users can view their own rewards" ON client_rewards
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Users can update their own rewards" ON client_rewards
  FOR UPDATE USING (auth.uid() = client_id);

CREATE POLICY "System can insert rewards" ON client_rewards
  FOR INSERT WITH CHECK (true);

-- RLS Policies for stripe_payments
CREATE POLICY "Users can view their own payments" ON stripe_payments
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "System can insert payments" ON stripe_payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payments" ON stripe_payments
  FOR UPDATE USING (true);

-- Function to automatically create points record for new clients
CREATE OR REPLACE FUNCTION create_client_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO client_points (client_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create points record when new user signs up
DROP TRIGGER IF EXISTS create_points_on_signup ON auth.users;
CREATE TRIGGER create_points_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_client_points();

-- Function to add points to a client
CREATE OR REPLACE FUNCTION add_client_points(
  p_client_id UUID,
  p_points INTEGER,
  p_description TEXT,
  p_reference_type VARCHAR(50),
  p_reference_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert transaction record
  INSERT INTO points_transactions (
    client_id, 
    transaction_type, 
    points_amount, 
    description, 
    reference_type, 
    reference_id
  ) VALUES (
    p_client_id, 
    'earned', 
    p_points, 
    p_description, 
    p_reference_type, 
    p_reference_id
  );
  
  -- Update points balance
  UPDATE client_points 
  SET 
    points_balance = points_balance + p_points,
    total_points_earned = total_points_earned + p_points,
    updated_at = NOW()
  WHERE client_id = p_client_id;
END;
$$ LANGUAGE plpgsql;

-- Function to spend points
CREATE OR REPLACE FUNCTION spend_client_points(
  p_client_id UUID,
  p_points INTEGER,
  p_description TEXT,
  p_reference_type VARCHAR(50),
  p_reference_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT points_balance INTO current_balance 
  FROM client_points 
  WHERE client_id = p_client_id;
  
  -- Check if enough points
  IF current_balance < p_points THEN
    RETURN FALSE;
  END IF;
  
  -- Insert transaction record
  INSERT INTO points_transactions (
    client_id, 
    transaction_type, 
    points_amount, 
    description, 
    reference_type, 
    reference_id
  ) VALUES (
    p_client_id, 
    'spent', 
    p_points, 
    p_description, 
    p_reference_type, 
    p_reference_id
  );
  
  -- Update points balance
  UPDATE client_points 
  SET 
    points_balance = points_balance - p_points,
    total_points_spent = total_points_spent + p_points,
    updated_at = NOW()
  WHERE client_id = p_client_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for existing users
INSERT INTO client_points (client_id, points_balance, total_points_earned, total_points_spent)
SELECT id, 0, 0, 0 FROM auth.users 
WHERE id NOT IN (SELECT client_id FROM client_points);

-- Add points_reward column to community_events if it doesn't exist
ALTER TABLE community_events ADD COLUMN IF NOT EXISTS points_reward INTEGER DEFAULT 100;

-- Add points configuration to existing events (if any exist)
UPDATE community_events 
SET points_reward = CASE 
  WHEN price = 0 THEN 50  -- Free events give 50 points
  WHEN price <= 25 THEN 100  -- Events $25 or less give 100 points
  WHEN price <= 50 THEN 200  -- Events $26-50 give 200 points
  ELSE 300  -- Events over $50 give 300 points
END
WHERE points_reward IS NULL;

-- Create community_event_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS community_event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES community_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS for community_event_participants
ALTER TABLE community_event_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_event_participants
CREATE POLICY "Users can view their own event registrations" ON community_event_participants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own event registrations" ON community_event_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own event registrations" ON community_event_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event registrations" ON community_event_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for community_event_participants
CREATE INDEX IF NOT EXISTS idx_community_event_participants_event_id ON community_event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_community_event_participants_user_id ON community_event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_community_event_participants_status ON community_event_participants(status);

-- Function to increment event participants count
CREATE OR REPLACE FUNCTION increment_event_participants(event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_events 
  SET current_participants = COALESCE(current_participants, 0) + 1
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement event participants count
CREATE OR REPLACE FUNCTION decrement_event_participants(event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE community_events 
  SET current_participants = GREATEST(COALESCE(current_participants, 0) - 1, 0)
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;
