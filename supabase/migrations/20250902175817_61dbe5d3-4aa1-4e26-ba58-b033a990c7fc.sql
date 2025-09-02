-- Create security tables for anti-bot system

-- Risk scores and attack tracking
CREATE TABLE IF NOT EXISTS public.security_risk_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  user_id UUID,
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_factors JSONB NOT NULL DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() + interval '1 hour'
);

-- Rate limiting tracking
CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP or user ID
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_request TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Proof of work challenges
CREATE TABLE IF NOT EXISTS public.pow_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id TEXT NOT NULL UNIQUE,
  difficulty INTEGER NOT NULL,
  target_hash TEXT NOT NULL,
  ip_address INET NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() + interval '10 minutes',
  solved BOOLEAN NOT NULL DEFAULT false,
  solution_nonce TEXT
);

-- Action tokens for binding actions to page views
CREATE TABLE IF NOT EXISTS public.action_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  route TEXT NOT NULL,
  user_id UUID,
  ip_address INET NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now() + interval '5 minutes',
  used BOOLEAN NOT NULL DEFAULT false
);

-- Attack monitoring and logging
CREATE TABLE IF NOT EXISTS public.attack_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attack_type TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_id UUID,
  endpoint TEXT,
  user_agent TEXT,
  risk_score INTEGER,
  blocked BOOLEAN NOT NULL DEFAULT false,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security feature flags
CREATE TABLE IF NOT EXISTS public.security_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_risk_scores_ip ON public.security_risk_scores(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_risk_scores_expires ON public.security_risk_scores(expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_tracking_identifier ON public.rate_limit_tracking(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_pow_challenges_challenge_id ON public.pow_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_pow_challenges_expires ON public.pow_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_action_tokens_hash ON public.action_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_action_tokens_expires ON public.action_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_attack_logs_created ON public.attack_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attack_logs_ip ON public.attack_logs(ip_address);

-- RLS policies
ALTER TABLE public.security_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pow_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attack_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_config ENABLE ROW LEVEL SECURITY;

-- Admin-only access for most security tables
CREATE POLICY "Admins can manage security data" ON public.security_risk_scores
  FOR ALL USING (get_user_admin_status() = true);

CREATE POLICY "Admins can manage rate limits" ON public.rate_limit_tracking
  FOR ALL USING (get_user_admin_status() = true);

CREATE POLICY "Users can access their own challenges" ON public.pow_challenges
  FOR SELECT USING (ip_address = inet_client_addr());

CREATE POLICY "Users can access their own action tokens" ON public.action_tokens
  FOR SELECT USING (ip_address = inet_client_addr() OR user_id = auth.uid());

CREATE POLICY "Admins can view all attack logs" ON public.attack_logs
  FOR SELECT USING (get_user_admin_status() = true);

CREATE POLICY "Admins can manage security config" ON public.security_config
  FOR ALL USING (get_user_admin_status() = true);

-- Cleanup functions
CREATE OR REPLACE FUNCTION public.cleanup_expired_security_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up expired risk scores
  DELETE FROM public.security_risk_scores WHERE expires_at < now();
  
  -- Clean up old rate limit data (keep last 24 hours)
  DELETE FROM public.rate_limit_tracking WHERE last_request < now() - interval '24 hours';
  
  -- Clean up expired challenges
  DELETE FROM public.pow_challenges WHERE expires_at < now();
  
  -- Clean up expired action tokens
  DELETE FROM public.action_tokens WHERE expires_at < now();
  
  -- Clean up old attack logs (keep last 30 days)
  DELETE FROM public.attack_logs WHERE created_at < now() - interval '30 days';
END;
$$;

-- Insert default security config
INSERT INTO public.security_config (config_key, config_value) VALUES
  ('under_attack', '{"enabled": false}'),
  ('captcha_always_on', '{"enabled": false}'),
  ('pow_enforce_high_risk', '{"enabled": true}'),
  ('close_signups', '{"enabled": false}'),
  ('risk_thresholds', '{"low": 25, "medium": 50, "high": 75, "severe": 90}'),
  ('pow_difficulty', '{"bits": 20}')
ON CONFLICT (config_key) DO NOTHING;