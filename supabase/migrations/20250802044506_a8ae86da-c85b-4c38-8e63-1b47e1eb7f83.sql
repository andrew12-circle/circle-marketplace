-- Create blocked_ips table for IP blocking functionality
CREATE TABLE public.blocked_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  requests_count INTEGER NOT NULL DEFAULT 0,
  user_agent TEXT,
  is_permanent BOOLEAN NOT NULL DEFAULT false,
  blocked_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- Create policies for blocked_ips
CREATE POLICY "Admins can manage blocked IPs"
ON public.blocked_ips
FOR ALL
USING (get_user_admin_status());

CREATE POLICY "System can insert blocked IPs"
ON public.blocked_ips
FOR INSERT
WITH CHECK (true);

-- Create request_logs table for tracking requests
CREATE TABLE public.request_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  user_agent TEXT,
  referer TEXT,
  request_size INTEGER,
  response_status INTEGER,
  response_time_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for request_logs
CREATE POLICY "System can insert request logs"
ON public.request_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view request logs"
ON public.request_logs
FOR SELECT
USING (get_user_admin_status());

-- Create scraping_settings table for configuration
CREATE TABLE public.scraping_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 100,
  time_window_seconds INTEGER NOT NULL DEFAULT 60,
  enabled BOOLEAN NOT NULL DEFAULT true,
  auto_block_threshold INTEGER NOT NULL DEFAULT 200,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.scraping_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for scraping_settings
CREATE POLICY "Admins can manage scraping settings"
ON public.scraping_settings
FOR ALL
USING (get_user_admin_status());

-- Insert default settings
INSERT INTO public.scraping_settings (rate_limit_per_minute, time_window_seconds, enabled, auto_block_threshold)
VALUES (100, 60, true, 200);

-- Create function to detect suspicious activity
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  suspicious_activity jsonb;
BEGIN
  -- Analyze request logs for suspicious patterns
  SELECT jsonb_agg(
    jsonb_build_object(
      'ip_address', ip_address::text,
      'requests_count', request_count,
      'time_window', '1 hour',
      'risk_score', LEAST(10, GREATEST(1, (request_count / 20.0)::integer)),
      'user_agents', user_agents,
      'endpoints', endpoints
    )
  ) INTO suspicious_activity
  FROM (
    SELECT 
      ip_address,
      COUNT(*) as request_count,
      array_agg(DISTINCT user_agent) FILTER (WHERE user_agent IS NOT NULL) as user_agents,
      array_agg(DISTINCT endpoint) as endpoints
    FROM public.request_logs
    WHERE timestamp > now() - interval '1 hour'
      AND ip_address NOT IN (SELECT ip_address FROM public.blocked_ips WHERE expires_at > now() OR is_permanent = true)
    GROUP BY ip_address
    HAVING COUNT(*) > 50
    ORDER BY COUNT(*) DESC
    LIMIT 20
  ) suspicious;
  
  RETURN COALESCE(suspicious_activity, '[]'::jsonb);
END;
$function$;

-- Create function to auto-block IPs
CREATE OR REPLACE FUNCTION public.auto_block_suspicious_ips()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  threshold INTEGER;
  suspicious_ip RECORD;
BEGIN
  -- Get current threshold
  SELECT auto_block_threshold INTO threshold
  FROM public.scraping_settings
  WHERE id = (SELECT id FROM public.scraping_settings ORDER BY updated_at DESC LIMIT 1);
  
  -- Auto-block IPs exceeding threshold
  FOR suspicious_ip IN 
    SELECT 
      ip_address,
      COUNT(*) as request_count
    FROM public.request_logs
    WHERE timestamp > now() - interval '10 minutes'
      AND ip_address NOT IN (SELECT ip_address FROM public.blocked_ips WHERE expires_at > now() OR is_permanent = true)
    GROUP BY ip_address
    HAVING COUNT(*) > threshold
  LOOP
    -- Block the IP
    INSERT INTO public.blocked_ips (ip_address, reason, requests_count, expires_at)
    VALUES (
      suspicious_ip.ip_address,
      'Auto-blocked for excessive requests (' || suspicious_ip.request_count || ' in 10 minutes)',
      suspicious_ip.request_count,
      now() + interval '1 hour'
    );
    
    -- Log security event
    INSERT INTO public.security_events (event_type, event_data)
    VALUES (
      'scraping_attempt_detected',
      jsonb_build_object(
        'ip_address', suspicious_ip.ip_address::text,
        'requests_count', suspicious_ip.request_count,
        'auto_blocked', true,
        'threshold', threshold
      )
    );
  END LOOP;
END;
$function$;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_blocked_ips_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER update_blocked_ips_updated_at
  BEFORE UPDATE ON public.blocked_ips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blocked_ips_updated_at();

-- Create indexes for performance
CREATE INDEX idx_blocked_ips_ip_address ON public.blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_expires_at ON public.blocked_ips(expires_at);
CREATE INDEX idx_request_logs_ip_timestamp ON public.request_logs(ip_address, timestamp);
CREATE INDEX idx_request_logs_timestamp ON public.request_logs(timestamp);
CREATE INDEX idx_security_events_type_created ON public.security_events(event_type, created_at);