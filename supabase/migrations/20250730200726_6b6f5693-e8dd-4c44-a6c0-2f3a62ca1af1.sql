-- Fix SECURITY DEFINER functions by adding proper search_path
CREATE OR REPLACE FUNCTION public.get_user_admin_status()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.user_has_specialty(specialty_name text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (specialties @> ARRAY[specialty_name] OR specialty_name = ANY(specialties))
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
 RETURNS TABLE(id uuid, display_name text, business_name text, location text, specialties text[], years_experience integer, website_url text, avatar_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.business_name,
    p.location,
    p.specialties,
    p.years_experience,
    p.website_url,
    p.avatar_url
  FROM public.profiles p
  WHERE p.id = profile_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  radius DECIMAL := 3959; -- Earth radius in miles
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN radius * c;
END;
$function$;

-- Add password policy validation function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Minimum 8 characters, at least one uppercase, one lowercase, one number
  RETURN length(password) >= 8 
    AND password ~ '[A-Z]' 
    AND password ~ '[a-z]' 
    AND password ~ '[0-9]';
END;
$function$;

-- Create login attempts tracking table
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  ip_address inet,
  attempt_time timestamp with time zone NOT NULL DEFAULT now(),
  success boolean NOT NULL DEFAULT false,
  user_agent text
);

-- Enable RLS on login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for login attempts (only system can access)
CREATE POLICY "System can manage login attempts" 
ON public.login_attempts 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Create function to check account lockout
CREATE OR REPLACE FUNCTION public.check_account_lockout(user_email text, client_ip inet DEFAULT NULL)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  failed_attempts integer;
  last_attempt timestamp with time zone;
  lockout_until timestamp with time zone;
  result jsonb;
BEGIN
  -- Count failed attempts in last 15 minutes
  SELECT COUNT(*), MAX(attempt_time)
  INTO failed_attempts, last_attempt
  FROM public.login_attempts
  WHERE email = user_email
    AND success = false
    AND attempt_time > now() - interval '15 minutes'
    AND (client_ip IS NULL OR ip_address = client_ip);
  
  -- Progressive lockout: 5 attempts = 5 min, 10 = 15 min, 15+ = 30 min
  IF failed_attempts >= 15 THEN
    lockout_until := last_attempt + interval '30 minutes';
  ELSIF failed_attempts >= 10 THEN
    lockout_until := last_attempt + interval '15 minutes';
  ELSIF failed_attempts >= 5 THEN
    lockout_until := last_attempt + interval '5 minutes';
  ELSE
    lockout_until := NULL;
  END IF;
  
  result := jsonb_build_object(
    'is_locked', lockout_until > now(),
    'failed_attempts', failed_attempts,
    'lockout_until', lockout_until,
    'retry_after_seconds', CASE 
      WHEN lockout_until > now() THEN extract(epoch from (lockout_until - now()))::integer
      ELSE 0
    END
  );
  
  RETURN result;
END;
$function$;

-- Create function to log login attempts
CREATE OR REPLACE FUNCTION public.log_login_attempt(
  user_email text, 
  success boolean, 
  client_ip inet DEFAULT NULL, 
  client_user_agent text DEFAULT NULL
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.login_attempts (email, ip_address, success, user_agent)
  VALUES (user_email, client_ip, success, client_user_agent);
  
  -- Clean up old attempts (keep only last 24 hours)
  DELETE FROM public.login_attempts 
  WHERE attempt_time < now() - interval '24 hours';
END;
$function$;

-- Create session timeout tracking
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_token text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_activity timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 minutes'),
  ip_address inet,
  user_agent text
);

-- Enable RLS on admin_sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for admin sessions
CREATE POLICY "Users can manage their own admin sessions" 
ON public.admin_sessions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to validate admin session
CREATE OR REPLACE FUNCTION public.validate_admin_session(session_token text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  session_valid boolean := false;
BEGIN
  -- Check if session exists and is not expired
  SELECT EXISTS(
    SELECT 1 FROM public.admin_sessions 
    WHERE session_token = session_token 
      AND user_id = auth.uid()
      AND expires_at > now()
  ) INTO session_valid;
  
  -- Update last activity if session is valid
  IF session_valid THEN
    UPDATE public.admin_sessions 
    SET last_activity = now(),
        expires_at = now() + interval '30 minutes'
    WHERE session_token = session_token AND user_id = auth.uid();
  END IF;
  
  RETURN session_valid;
END;
$function$;