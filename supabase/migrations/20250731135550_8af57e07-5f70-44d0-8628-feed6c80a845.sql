-- Fix security warnings for function search paths
CREATE OR REPLACE FUNCTION expire_co_pay_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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

CREATE OR REPLACE FUNCTION update_co_pay_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;