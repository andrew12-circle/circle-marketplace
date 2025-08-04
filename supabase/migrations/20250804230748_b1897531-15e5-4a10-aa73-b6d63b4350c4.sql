-- Fix security issues identified by linter

-- Fix function search path for refresh_vendor_analytics
CREATE OR REPLACE FUNCTION refresh_vendor_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY vendor_service_analytics;
END;
$$;

-- Fix function search path for process_background_job
CREATE OR REPLACE FUNCTION process_background_job(job_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  job_record RECORD;
  result JSONB;
BEGIN
  -- Get and lock the job
  SELECT * INTO job_record
  FROM background_jobs
  WHERE id = job_id AND status = 'pending'
  FOR UPDATE SKIP LOCKED;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Job not found or already processed');
  END IF;
  
  -- Mark job as started
  UPDATE background_jobs 
  SET status = 'processing', started_at = now(), attempts = attempts + 1
  WHERE id = job_id;
  
  -- Process based on job type
  CASE job_record.job_type
    WHEN 'refresh_analytics' THEN
      PERFORM refresh_vendor_analytics();
      result := jsonb_build_object('success', true, 'message', 'Analytics refreshed');
    
    WHEN 'cleanup_cache' THEN
      -- This would be handled by the application layer
      result := jsonb_build_object('success', true, 'message', 'Cache cleanup queued');
    
    ELSE
      result := jsonb_build_object('success', false, 'error', 'Unknown job type');
  END CASE;
  
  -- Mark job as completed or failed
  IF result->>'success' = 'true' THEN
    UPDATE background_jobs 
    SET status = 'completed', completed_at = now()
    WHERE id = job_id;
  ELSE
    UPDATE background_jobs 
    SET status = 'failed', error_message = result->>'error'
    WHERE id = job_id;
  END IF;
  
  RETURN result;
END;
$$;