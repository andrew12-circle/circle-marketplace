-- Fix security issues from the linter

-- 1. Fix function search path mutable - add SET search_path = '' to all SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.get_user_admin_status()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$$;

-- Update other security definer functions that may be missing search_path
CREATE OR REPLACE FUNCTION public.update_co_pay_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_co_pay_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.co_pay_requests 
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' AND expires_at < now();
  
  -- Log the expiration
  INSERT INTO public.co_pay_audit_log (co_pay_request_id, action_type, action_details)
  SELECT id, 'expired', jsonb_build_object('auto_expired', true)
  FROM public.co_pay_requests 
  WHERE status = 'expired' AND updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_vendor_active_agents(vendor_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  active_agent_count INTEGER;
BEGIN
  -- Count distinct agents who have had activity with this vendor in the last 90 days
  SELECT COUNT(DISTINCT agent_id) INTO active_agent_count
  FROM public.vendor_agent_activities
  WHERE vendor_id = vendor_uuid
  AND created_at > now() - interval '90 days';
  
  RETURN COALESCE(active_agent_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_account_lockout(user_email text, client_ip inet DEFAULT NULL::inet)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Create background job processing function with proper security
CREATE OR REPLACE FUNCTION public.process_background_job(job_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  job_record RECORD;
  result JSONB;
BEGIN
  -- Get and lock the job
  SELECT * INTO job_record
  FROM public.background_jobs
  WHERE id = job_id AND status = 'pending'
  FOR UPDATE SKIP LOCKED;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job not found or already processed');
  END IF;
  
  -- Mark job as started
  UPDATE public.background_jobs 
  SET status = 'processing', started_at = now(), attempts = attempts + 1
  WHERE id = job_id;
  
  -- Process based on job type
  CASE job_record.job_type
    WHEN 'refresh_analytics' THEN
      -- Call analytics refresh (would be handled by background worker)
      result := jsonb_build_object('success', true, 'message', 'Analytics refresh queued');
    
    WHEN 'cleanup_cache' THEN
      -- This would be handled by the application layer
      result := jsonb_build_object('success', true, 'message', 'Cache cleanup queued');
    
    ELSE
      result := jsonb_build_object('success', false, 'error', 'Unknown job type');
  END CASE;
  
  -- Mark job as completed or failed
  IF result->>'success' = 'true' THEN
    UPDATE public.background_jobs 
    SET status = 'completed', completed_at = now()
    WHERE id = job_id;
  ELSE
    UPDATE public.background_jobs 
    SET status = 'failed', error_message = result->>'error'
    WHERE id = job_id;
  END IF;
  
  RETURN result;
END;
$$;