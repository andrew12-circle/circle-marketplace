-- Create tables for outbound click tracking and referral tokens
-- 1) outbound_clicks to log each outbound redirect
-- 2) referral_tokens to optionally mint/link tokens to users for attribution

-- Create referral_tokens table
CREATE TABLE IF NOT EXISTS public.referral_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  user_id UUID NULL,
  vendor_id UUID NULL,
  service_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.referral_tokens ENABLE ROW LEVEL SECURITY;

-- RLS: user can see their own tokens; admins can see all; inserts via system only
CREATE POLICY "Users can view their own referral tokens"
ON public.referral_tokens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage referral tokens"
ON public.referral_tokens
FOR ALL
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

CREATE POLICY "System can insert referral tokens"
ON public.referral_tokens
FOR INSERT
WITH CHECK (true);

-- Create outbound_clicks table
CREATE TABLE IF NOT EXISTS public.outbound_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NULL,
  vendor_id UUID NULL,
  user_id UUID NULL,
  referral_token TEXT NULL,
  agent_cookie TEXT NULL,
  destination_url TEXT NOT NULL,
  final_url TEXT NULL,
  referrer TEXT NULL,
  user_agent TEXT NULL,
  ip_address INET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.outbound_clicks ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can view all, users can view their own rows (by user_id), system can insert
CREATE POLICY "Admins can view all outbound clicks"
ON public.outbound_clicks
FOR SELECT
USING (get_user_admin_status());

CREATE POLICY "Users can view their own outbound clicks"
ON public.outbound_clicks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert outbound clicks"
ON public.outbound_clicks
FOR INSERT
WITH CHECK (true);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_service ON public.outbound_clicks(service_id);
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_vendor ON public.outbound_clicks(vendor_id);
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_user ON public.outbound_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_token ON public.outbound_clicks(referral_token);

-- Optional: function to mint tokens (short, url-safe)
CREATE OR REPLACE FUNCTION public.mint_referral_token(p_user_id uuid, p_vendor_id uuid, p_service_id uuid, p_ttl_minutes integer DEFAULT 1440)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tok TEXT;
BEGIN
  tok := encode(gen_random_bytes(8), 'hex');
  INSERT INTO public.referral_tokens(token, user_id, vendor_id, service_id, expires_at)
  VALUES (tok, p_user_id, p_vendor_id, p_service_id, now() + make_interval(mins => p_ttl_minutes));
  RETURN tok;
END;
$$;