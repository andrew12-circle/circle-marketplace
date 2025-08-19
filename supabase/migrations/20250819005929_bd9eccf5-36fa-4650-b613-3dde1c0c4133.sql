-- Fix remaining security issues

-- 1. Find and fix all functions without SET search_path
-- List of functions that still need fixing based on the schema
CREATE OR REPLACE FUNCTION public.update_co_pay_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_help_kb_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.search_vectors := to_tsvector('english', NEW.title || ' ' || NEW.content);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_create_vendor_record()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only create vendor record if user doesn't already have one
  IF NOT EXISTS (SELECT 1 FROM public.vendors WHERE id = NEW.id) THEN
    INSERT INTO public.vendors (
      id, 
      name, 
      contact_email,
      approval_status,
      is_active,
      is_verified,
      auto_score
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.raw_user_meta_data->>'name', 'New Vendor'),
      NEW.email,
      'pending',
      false,
      false,
      0
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_vendor_ranking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update sort_order based on commission percentage (higher commission = lower sort_order = higher ranking)
  UPDATE public.vendors 
  SET sort_order = CASE 
    WHEN circle_commission_percentage >= 15 THEN 1
    WHEN circle_commission_percentage >= 10 THEN 2
    WHEN circle_commission_percentage >= 5 THEN 3
    WHEN circle_commission_percentage >= 2 THEN 4
    ELSE 5
  END
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_seed_vendor_questions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.seed_standardized_vendor_questions(NEW.id);
  RETURN NEW;
END;
$$;

-- 2. Fix critical functions with security definer
CREATE OR REPLACE FUNCTION public.validate_admin_session_context()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_valid_admin BOOLEAN := false;
  session_count INTEGER;
BEGIN
  -- Check if user is actually admin
  SELECT is_admin INTO is_valid_admin
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF NOT COALESCE(is_valid_admin, false) THEN
    -- Log unauthorized admin attempt
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'unauthorized_admin_access_attempt',
      auth.uid(),
      jsonb_build_object(
        'ip_address', inet_client_addr()::text,
        'timestamp', now()
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_admin_operation_rate_limit_strict()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  operation_count_5min integer;
  operation_count_1hour integer;
  operation_count_24h integer;
BEGIN
  -- Count admin operations in different time windows
  SELECT COUNT(*) INTO operation_count_5min
  FROM public.security_events
  WHERE user_id = auth.uid()
    AND event_type LIKE '%admin%'
    AND created_at > now() - interval '5 minutes';
    
  SELECT COUNT(*) INTO operation_count_1hour
  FROM public.security_events
  WHERE user_id = auth.uid()
    AND event_type LIKE '%admin%'
    AND created_at > now() - interval '1 hour';
    
  SELECT COUNT(*) INTO operation_count_24h
  FROM public.security_events
  WHERE user_id = auth.uid()
    AND event_type LIKE '%admin%'
    AND created_at > now() - interval '24 hours';
  
  -- Strict rate limits: 5 per 5min, 20 per hour, 100 per day
  IF operation_count_5min >= 5 OR operation_count_1hour >= 20 OR operation_count_24h >= 100 THEN
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
      'admin_rate_limit_exceeded_strict',
      auth.uid(),
      jsonb_build_object(
        'counts', jsonb_build_object(
          '5min', operation_count_5min,
          '1hour', operation_count_1hour,
          '24h', operation_count_24h
        ),
        'timestamp', now()
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;