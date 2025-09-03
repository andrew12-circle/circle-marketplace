-- Create sponsored positioning system

-- Sponsored position tiers enum
CREATE TYPE sponsored_tier AS ENUM ('featured', 'premium', 'top_ranked');

-- Sponsored position status enum  
CREATE TYPE sponsored_status AS ENUM ('active', 'pending', 'expired', 'cancelled');

-- Sponsored positions table
CREATE TABLE public.sponsored_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  service_id UUID,
  tier sponsored_tier NOT NULL,
  status sponsored_status NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sponsored pricing tiers table
CREATE TABLE public.sponsored_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier sponsored_tier NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_quarterly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  max_positions INTEGER NOT NULL DEFAULT 10,
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default pricing tiers
INSERT INTO public.sponsored_pricing (tier, name, description, price_monthly, price_quarterly, price_yearly, max_positions, features) VALUES
('featured', 'Featured Listing', 'Stand out with a featured badge and higher visibility', 99.00, 267.00, 950.00, 50, '[
  "Featured badge on your listing",
  "2x higher visibility in search results", 
  "Priority placement in category listings",
  "Enhanced listing appearance"
]'),
('premium', 'Premium Placement', 'Get premium positioning and advanced features', 199.00, 537.00, 1900.00, 25, '[
  "All Featured benefits",
  "Top 3 positioning in search results",
  "Premium badge and styling",
  "Advanced analytics dashboard",
  "Priority customer support"
]'),
('top_ranked', 'Top Ranked', 'Ultimate visibility with #1 positioning', 399.00, 1077.00, 3800.00, 10, '[
  "All Premium benefits", 
  "#1 positioning in search results",
  "Top Ranked badge",
  "Featured in homepage highlights",
  "Dedicated account manager",
  "Custom marketing support"
]');

-- Enable RLS
ALTER TABLE public.sponsored_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sponsored_positions
CREATE POLICY "Vendors can view their own sponsored positions" 
ON public.sponsored_positions 
FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can create their own sponsored positions" 
ON public.sponsored_positions 
FOR INSERT 
WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their own sponsored positions" 
ON public.sponsored_positions 
FOR UPDATE 
USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all sponsored positions" 
ON public.sponsored_positions 
FOR ALL 
USING (get_user_admin_status());

-- RLS Policies for sponsored_pricing
CREATE POLICY "Sponsored pricing is viewable by authenticated users" 
ON public.sponsored_pricing 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can manage sponsored pricing" 
ON public.sponsored_pricing 
FOR ALL 
USING (get_user_admin_status());

-- Indexes for performance
CREATE INDEX idx_sponsored_positions_vendor_id ON public.sponsored_positions(vendor_id);
CREATE INDEX idx_sponsored_positions_status ON public.sponsored_positions(status);
CREATE INDEX idx_sponsored_positions_tier ON public.sponsored_positions(tier);
CREATE INDEX idx_sponsored_positions_expires_at ON public.sponsored_positions(expires_at);

-- Function to automatically expire sponsored positions
CREATE OR REPLACE FUNCTION expire_sponsored_positions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sponsored_positions 
  SET status = 'expired'
  WHERE status = 'active' 
    AND expires_at <= now();
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sponsored_position_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sponsored_positions_updated_at
  BEFORE UPDATE ON public.sponsored_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_sponsored_position_updated_at();

CREATE TRIGGER update_sponsored_pricing_updated_at
  BEFORE UPDATE ON public.sponsored_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_sponsored_position_updated_at();