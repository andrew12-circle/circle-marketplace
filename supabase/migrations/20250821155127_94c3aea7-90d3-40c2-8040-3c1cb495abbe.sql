-- Update admin rate limits to be more reasonable for admin work
CREATE OR REPLACE FUNCTION public.check_admin_operation_rate_limit_strict()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- More reasonable rate limits: 20 per 5min, 100 per hour, 500 per day
  IF operation_count_5min >= 20 OR operation_count_1hour >= 100 OR operation_count_24h >= 500 THEN
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
$function$;