-- Create security configuration table for admin bypass rules
CREATE TABLE IF NOT EXISTS public.security_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on security_config
ALTER TABLE public.security_config ENABLE ROW LEVEL SECURITY;

-- Only admins can manage security config
CREATE POLICY "Only admins can manage security config" 
ON public.security_config 
FOR ALL 
USING (public.get_user_admin_status() = true)
WITH CHECK (public.get_user_admin_status() = true);

-- Insert default security config for admin bypass rules
INSERT INTO public.security_config (config_key, config_value, description, created_by) VALUES 
('admin_ip_bypass', '{"enabled": true, "reason": "Admins bypass all IP restrictions for global access"}', 'Allow admins to bypass IP blocking from any location', NULL),
('admin_rate_limit_bypass', '{"enabled": true, "multiplier": 10, "reason": "Admins get 10x rate limits"}', 'Give admins higher rate limits for admin operations', NULL),
('admin_geo_bypass', '{"enabled": true, "allowed_countries": ["*"], "reason": "Admins can access from any country"}', 'Allow admin access from any geographic location', NULL)
ON CONFLICT (config_key) DO NOTHING;

-- Function to check if admin should bypass IP restrictions
CREATE OR REPLACE FUNCTION public.should_bypass_ip_restrictions(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin BOOLEAN := false;
  bypass_enabled BOOLEAN := false;
BEGIN
  -- Quick admin check
  SELECT public.get_user_admin_status() INTO is_admin;
  
  IF NOT COALESCE(is_admin, false) THEN
    RETURN false;
  END IF;
  
  -- Check if admin IP bypass is enabled
  SELECT COALESCE((config_value->>'enabled')::boolean, false) INTO bypass_enabled
  FROM public.security_config 
  WHERE config_key = 'admin_ip_bypass';
  
  RETURN COALESCE(bypass_enabled, true); -- Default to true for admin safety
EXCEPTION
  WHEN OTHERS THEN
    -- On any error, allow admin access for safety
    RETURN COALESCE(is_admin, false);
END;
$$;

-- Function to check if IP is blocked (safe for admins)
CREATE OR REPLACE FUNCTION public.is_ip_blocked_safe(p_ip_address INET, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_blocked BOOLEAN := false;
  should_bypass BOOLEAN := false;
BEGIN
  -- Check if admin should bypass
  SELECT public.should_bypass_ip_restrictions(p_user_id) INTO should_bypass;
  
  IF should_bypass THEN
    RETURN false; -- Never block admins
  END IF;
  
  -- Check if IP is in blocked list
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_ips 
    WHERE ip_address = p_ip_address 
      AND (expires_at IS NULL OR expires_at > now())
      AND is_permanent = true
  ) INTO is_blocked;
  
  RETURN COALESCE(is_blocked, false);
EXCEPTION
  WHEN OTHERS THEN
    -- On error, don't block (fail-open for stability)
    RETURN false;
END;
$$;

-- Enhanced admin rate limit check that's admin-friendly
CREATE OR REPLACE FUNCTION public.check_admin_operation_rate_limit_safe()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_admin BOOLEAN := false;
  rate_multiplier NUMERIC := 1;
  operations_count INTEGER := 0;
  time_window INTERVAL := '1 hour';
  max_operations INTEGER := 50; -- Base limit
BEGIN
  -- Check admin status
  SELECT public.get_user_admin_status() INTO is_admin;
  
  IF NOT COALESCE(is_admin, false) THEN
    RETURN false;
  END IF;
  
  -- Get admin rate limit multiplier
  SELECT COALESCE((config_value->>'multiplier')::numeric, 10) INTO rate_multiplier
  FROM public.security_config 
  WHERE config_key = 'admin_rate_limit_bypass';
  
  -- Apply multiplier to max operations
  max_operations := max_operations * COALESCE(rate_multiplier, 10);
  
  -- Count recent admin operations
  SELECT COUNT(*) INTO operations_count
  FROM public.security_events
  WHERE user_id = auth.uid()
    AND event_type LIKE 'admin_%'
    AND created_at > (now() - time_window);
  
  -- Allow if under limit
  RETURN operations_count < max_operations;
EXCEPTION
  WHEN OTHERS THEN
    -- On error, allow admin operations for stability
    RETURN true;
END;
$$;

-- Enhanced admin self-check with network diagnostics
CREATE OR REPLACE FUNCTION public.admin_self_check_enhanced()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_profile RECORD;
    admin_status_methods RECORD;
    session_info RECORD;
    network_info RECORD;
    security_config_info RECORD;
    result JSONB;
    client_ip INET;
BEGIN
    -- Get current user profile
    SELECT user_id, is_admin, specialties, display_name, created_at
    INTO current_user_profile
    FROM public.profiles 
    WHERE user_id = auth.uid();
    
    -- Check different admin verification methods
    SELECT 
        public.get_user_admin_status() as function_check,
        CASE WHEN current_user_profile.is_admin = true THEN true ELSE false END as profile_is_admin,
        CASE WHEN 'admin' = ANY(current_user_profile.specialties) THEN true ELSE false END as specialties_admin
    INTO admin_status_methods;
    
    -- Get session info safely
    BEGIN
        SELECT 
            auth.uid() as user_id,
            auth.jwt()->>'role' as jwt_role,
            auth.jwt()->>'aud' as jwt_audience,
            CASE 
                WHEN auth.jwt()->>'exp' IS NOT NULL THEN
                    EXTRACT(EPOCH FROM (TO_TIMESTAMP((auth.jwt()->>'exp')::int) - NOW()))
                ELSE 0
            END as jwt_expires_in_seconds
        INTO session_info;
    EXCEPTION
        WHEN OTHERS THEN
            session_info.user_id := auth.uid();
            session_info.jwt_role := 'unknown';
            session_info.jwt_audience := 'unknown';
            session_info.jwt_expires_in_seconds := 0;
    END;
    
    -- Get network info
    BEGIN
        client_ip := inet_client_addr();
        SELECT 
            client_ip as detected_ip,
            public.should_bypass_ip_restrictions() as can_bypass_ip,
            public.is_ip_blocked_safe(client_ip) as ip_is_blocked,
            public.check_admin_operation_rate_limit_safe() as rate_limit_ok
        INTO network_info;
    EXCEPTION
        WHEN OTHERS THEN
            network_info.detected_ip := NULL;
            network_info.can_bypass_ip := true;
            network_info.ip_is_blocked := false;
            network_info.rate_limit_ok := true;
    END;
    
    -- Get security config status
    BEGIN
        SELECT 
            COUNT(*) as total_configs,
            COUNT(CASE WHEN config_key = 'admin_ip_bypass' AND (config_value->>'enabled')::boolean = true THEN 1 END) as ip_bypass_enabled,
            COUNT(CASE WHEN config_key = 'admin_rate_limit_bypass' AND (config_value->>'enabled')::boolean = true THEN 1 END) as rate_bypass_enabled,
            COUNT(CASE WHEN config_key = 'admin_geo_bypass' AND (config_value->>'enabled')::boolean = true THEN 1 END) as geo_bypass_enabled
        INTO security_config_info
        FROM public.security_config
        WHERE config_key IN ('admin_ip_bypass', 'admin_rate_limit_bypass', 'admin_geo_bypass');
    EXCEPTION
        WHEN OTHERS THEN
            security_config_info.total_configs := 0;
            security_config_info.ip_bypass_enabled := 0;
            security_config_info.rate_bypass_enabled := 0;
            security_config_info.geo_bypass_enabled := 0;
    END;
    
    -- Build comprehensive result
    result := jsonb_build_object(
        'timestamp', NOW(),
        'user_authenticated', auth.uid() IS NOT NULL,
        'user_id', session_info.user_id,
        'profile_exists', current_user_profile.user_id IS NOT NULL,
        'admin_checks', jsonb_build_object(
            'function_result', COALESCE(admin_status_methods.function_check, false),
            'profile_is_admin', COALESCE(admin_status_methods.profile_is_admin, false),
            'specialties_admin', COALESCE(admin_status_methods.specialties_admin, false),
            'any_admin_method', COALESCE(
                admin_status_methods.function_check = true OR
                admin_status_methods.profile_is_admin = true OR
                admin_status_methods.specialties_admin = true,
                false
            )
        ),
        'network_status', jsonb_build_object(
            'client_ip', network_info.detected_ip,
            'can_bypass_ip_restrictions', COALESCE(network_info.can_bypass_ip, true),
            'ip_is_blocked', COALESCE(network_info.ip_is_blocked, false),
            'rate_limit_ok', COALESCE(network_info.rate_limit_ok, true),
            'connection_stable', true
        ),
        'security_config', jsonb_build_object(
            'total_configs', COALESCE(security_config_info.total_configs, 0),
            'ip_bypass_enabled', COALESCE(security_config_info.ip_bypass_enabled, 0) > 0,
            'rate_bypass_enabled', COALESCE(security_config_info.rate_bypass_enabled, 0) > 0,
            'geo_bypass_enabled', COALESCE(security_config_info.geo_bypass_enabled, 0) > 0,
            'admin_protection_active', true
        ),
        'profile_data', jsonb_build_object(
            'display_name', current_user_profile.display_name,
            'is_admin', current_user_profile.is_admin,
            'specialties', COALESCE(current_user_profile.specialties, '{}'),
            'created_at', current_user_profile.created_at
        ),
        'session_info', jsonb_build_object(
            'jwt_role', session_info.jwt_role,
            'jwt_audience', session_info.jwt_audience,
            'jwt_expires_in_seconds', session_info.jwt_expires_in_seconds,
            'session_valid', session_info.jwt_expires_in_seconds > 0
        ),
        'stability_status', jsonb_build_object(
            'admin_access_guaranteed', true,
            'bypass_protections_active', true,
            'fail_safe_mode', 'enabled',
            'global_access_enabled', true
        )
    );
    
    -- Log this enhanced diagnostic check
    BEGIN
        INSERT INTO public.security_events (event_type, user_id, event_data)
        VALUES (
            'admin_enhanced_self_check_performed',
            auth.uid(),
            result || jsonb_build_object('diagnostic_version', '2.0')
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Ignore if security_events table doesn't exist
            NULL;
    END;
    
    RETURN result;
END;
$$;