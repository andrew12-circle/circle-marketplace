-- Circle Network Affiliate Program Schema

-- Create enums
CREATE TYPE public.affiliate_onboarding_status AS ENUM (
  'not_started', 'pending_kyc', 'approved', 'rejected'
);

CREATE TYPE public.affiliate_status AS ENUM (
  'active', 'paused', 'banned'
);

CREATE TYPE public.affiliate_tax_status AS ENUM (
  'individual', 'business'
);

CREATE TYPE public.affiliate_payout_method AS ENUM (
  'stripe_connect', 'ach_manual'
);

CREATE TYPE public.affiliate_doc_type AS ENUM (
  'w9', 'w8ben', 'id_verification', 'ach_authorization', 'business_certificate', 'other'
);

CREATE TYPE public.affiliate_destination_type AS ENUM (
  'marketplace', 'academy', 'pro_membership', 'funnel'
);

CREATE TYPE public.affiliate_conversion_type AS ENUM (
  'marketplace_purchase', 'circle_pro_signup'
);

CREATE TYPE public.affiliate_conversion_status AS ENUM (
  'pending', 'approved', 'rejected', 'clawed_back'
);

CREATE TYPE public.affiliate_payout_status AS ENUM (
  'pending', 'processing', 'paid', 'failed'
);

-- Main affiliates table
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL,
  business_name TEXT,
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  tax_status affiliate_tax_status,
  tax_id TEXT,
  payout_method affiliate_payout_method,
  onboarding_status affiliate_onboarding_status NOT NULL DEFAULT 'not_started',
  agreement_version TEXT,
  agreement_signed_at TIMESTAMP WITH TIME ZONE,
  marketing_channels TEXT,
  website TEXT,
  notes TEXT, -- admin only
  status affiliate_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Affiliate documents
CREATE TABLE public.affiliate_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  doc_type affiliate_doc_type NOT NULL,
  file_url TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Affiliate links
CREATE TABLE public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  destination_type affiliate_destination_type NOT NULL,
  destination_url TEXT NOT NULL,
  status affiliate_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Affiliate clicks
CREATE TABLE public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  ip INET,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Affiliate attributions
CREATE TABLE public.affiliate_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  link_id UUID NOT NULL REFERENCES public.affiliate_links(id) ON DELETE CASCADE,
  prospect_user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  attribution_model TEXT NOT NULL DEFAULT 'last_click',
  cookie_expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Affiliate conversions
CREATE TABLE public.affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  link_id UUID REFERENCES public.affiliate_links(id),
  order_id TEXT,
  subscription_id TEXT,
  conversion_type affiliate_conversion_type NOT NULL,
  amount_gross NUMERIC(10,2) NOT NULL,
  eligible_amount NUMERIC(10,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_flat NUMERIC(10,2),
  commission_amount NUMERIC(10,2) NOT NULL,
  status affiliate_conversion_status NOT NULL DEFAULT 'pending',
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  approval_timestamp TIMESTAMP WITH TIME ZONE,
  notes TEXT, -- admin only
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Affiliate payouts
CREATE TABLE public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_commission NUMERIC(10,2) NOT NULL,
  adjustments NUMERIC(10,2) NOT NULL DEFAULT 0,
  payout_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  payout_amount NUMERIC(10,2) NOT NULL,
  payout_method affiliate_payout_method NOT NULL,
  payout_reference TEXT,
  payout_status affiliate_payout_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Affiliate program settings
CREATE TABLE public.settings_affiliate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cookie_window_days INTEGER NOT NULL DEFAULT 30,
  default_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  subscription_recurring_commission_months INTEGER NOT NULL DEFAULT 12,
  minimum_payout_threshold NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  payout_schedule_day INTEGER NOT NULL DEFAULT 15,
  refund_clawback_window_days INTEGER NOT NULL DEFAULT 30,
  blocked_products TEXT[] DEFAULT '{}',
  auto_approve_affiliates BOOLEAN NOT NULL DEFAULT false,
  program_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.settings_affiliate DEFAULT VALUES;

-- Enable RLS on all tables
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_affiliate ENABLE ROW LEVEL SECURITY;

-- RLS Policies for affiliates table
CREATE POLICY "Affiliates can view their own profile" 
ON public.affiliates FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Affiliates can update their own profile" 
ON public.affiliates FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create affiliate profile" 
ON public.affiliates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all affiliates" 
ON public.affiliates FOR ALL 
USING (get_user_admin_status());

-- RLS Policies for affiliate_documents
CREATE POLICY "Affiliates can manage their own documents" 
ON public.affiliate_documents FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.affiliates 
  WHERE affiliates.id = affiliate_documents.affiliate_id 
  AND affiliates.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all documents" 
ON public.affiliate_documents FOR ALL 
USING (get_user_admin_status());

-- RLS Policies for affiliate_links
CREATE POLICY "Affiliates can manage their own links" 
ON public.affiliate_links FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.affiliates 
  WHERE affiliates.id = affiliate_links.affiliate_id 
  AND affiliates.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all links" 
ON public.affiliate_links FOR ALL 
USING (get_user_admin_status());

-- RLS Policies for affiliate_clicks (read-only for affiliates)
CREATE POLICY "Affiliates can view their own clicks" 
ON public.affiliate_clicks FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.affiliates 
  WHERE affiliates.id = affiliate_clicks.affiliate_id 
  AND affiliates.user_id = auth.uid()
));

CREATE POLICY "System can insert clicks" 
ON public.affiliate_clicks FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all clicks" 
ON public.affiliate_clicks FOR ALL 
USING (get_user_admin_status());

-- RLS Policies for affiliate_attributions
CREATE POLICY "System can manage attributions" 
ON public.affiliate_attributions FOR ALL 
USING (true);

CREATE POLICY "Admins can manage all attributions" 
ON public.affiliate_attributions FOR ALL 
USING (get_user_admin_status());

-- RLS Policies for affiliate_conversions
CREATE POLICY "Affiliates can view their own conversions" 
ON public.affiliate_conversions FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.affiliates 
  WHERE affiliates.id = affiliate_conversions.affiliate_id 
  AND affiliates.user_id = auth.uid()
));

CREATE POLICY "System can insert conversions" 
ON public.affiliate_conversions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all conversions" 
ON public.affiliate_conversions FOR ALL 
USING (get_user_admin_status());

-- RLS Policies for affiliate_payouts
CREATE POLICY "Affiliates can view their own payouts" 
ON public.affiliate_payouts FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.affiliates 
  WHERE affiliates.id = affiliate_payouts.affiliate_id 
  AND affiliates.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all payouts" 
ON public.affiliate_payouts FOR ALL 
USING (get_user_admin_status());

-- RLS Policies for settings_affiliate
CREATE POLICY "Settings viewable by authenticated users" 
ON public.settings_affiliate FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can modify settings" 
ON public.settings_affiliate FOR ALL 
USING (get_user_admin_status());

-- Indexes for performance
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_status ON public.affiliates(status);
CREATE INDEX idx_affiliate_documents_affiliate_id ON public.affiliate_documents(affiliate_id);
CREATE INDEX idx_affiliate_links_affiliate_id ON public.affiliate_links(affiliate_id);
CREATE INDEX idx_affiliate_links_code ON public.affiliate_links(code);
CREATE INDEX idx_affiliate_clicks_link_id ON public.affiliate_clicks(link_id);
CREATE INDEX idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_clicks_clicked_at ON public.affiliate_clicks(clicked_at);
CREATE INDEX idx_affiliate_attributions_affiliate_id ON public.affiliate_attributions(affiliate_id);
CREATE INDEX idx_affiliate_attributions_prospect_user_id ON public.affiliate_attributions(prospect_user_id);
CREATE INDEX idx_affiliate_conversions_affiliate_id ON public.affiliate_conversions(affiliate_id);
CREATE INDEX idx_affiliate_conversions_status ON public.affiliate_conversions(status);
CREATE INDEX idx_affiliate_payouts_affiliate_id ON public.affiliate_payouts(affiliate_id);

-- Update triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_affiliates_updated_at 
  BEFORE UPDATE ON public.affiliates 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_conversions_updated_at 
  BEFORE UPDATE ON public.affiliate_conversions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_affiliate_payouts_updated_at 
  BEFORE UPDATE ON public.affiliate_payouts 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_affiliate_updated_at 
  BEFORE UPDATE ON public.settings_affiliate 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();