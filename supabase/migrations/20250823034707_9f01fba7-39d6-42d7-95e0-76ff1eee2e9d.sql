-- Create tables for playbook marketplace and purchases

-- Create playbook purchases table
CREATE TABLE playbook_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  playbook_id UUID REFERENCES content(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount NUMERIC NOT NULL,
  revenue_share_percentage NUMERIC NOT NULL DEFAULT 70,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create playbook access table to track who has access to what
CREATE TABLE playbook_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  playbook_id UUID REFERENCES content(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES playbook_purchases(id) ON DELETE CASCADE,
  access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, playbook_id)
);

-- Create creator earnings table for revenue tracking
CREATE TABLE creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  playbook_id UUID REFERENCES content(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES playbook_purchases(id) ON DELETE CASCADE,
  gross_amount NUMERIC NOT NULL,
  creator_earnings NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE playbook_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;

-- RLS policies for playbook_purchases
CREATE POLICY "Users can view their own purchases"
ON playbook_purchases
FOR SELECT
USING (auth.uid() = buyer_id);

CREATE POLICY "Users can create their own purchases"
ON playbook_purchases
FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "System can update purchases"
ON playbook_purchases
FOR UPDATE
USING (true); -- Edge functions can update

-- RLS policies for playbook_access
CREATE POLICY "Users can view their own access"
ON playbook_access
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can grant access"
ON playbook_access
FOR INSERT
WITH CHECK (true); -- Edge functions can grant access

-- RLS policies for creator_earnings
CREATE POLICY "Creators can view their own earnings"
ON creator_earnings
FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "System can create earnings records"
ON creator_earnings
FOR INSERT
WITH CHECK (true); -- Edge functions can create earnings

-- Create indexes for performance
CREATE INDEX idx_playbook_purchases_buyer_id ON playbook_purchases(buyer_id);
CREATE INDEX idx_playbook_purchases_stripe_session ON playbook_purchases(stripe_session_id);
CREATE INDEX idx_playbook_access_user_playbook ON playbook_access(user_id, playbook_id);
CREATE INDEX idx_creator_earnings_creator_id ON creator_earnings(creator_id);