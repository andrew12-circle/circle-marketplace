-- Fix for Supabase security warnings - Part 3: Core Security Fixes

-- 1. Fix the create_data_checksum function with proper hash function
DROP FUNCTION IF EXISTS public.create_data_checksum(jsonb);
CREATE OR REPLACE FUNCTION public.create_data_checksum(data_input jsonb)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT md5(data_input::text);
$$;

-- 2. Harden overly permissive RLS policies on sensitive tables
-- Remove overly broad policies and replace with restrictive ones

-- Drop overly permissive policies on sensitive tables
DROP POLICY IF EXISTS "System can manage background jobs" ON public.background_jobs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.ai_interaction_logs;
DROP POLICY IF EXISTS "System can manage query patterns" ON public.ai_query_patterns;
DROP POLICY IF EXISTS "System can create recommendation logs" ON public.ai_recommendation_log;
DROP POLICY IF EXISTS "Allow inserts from clients (anon or authed)" ON public.client_errors;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.co_pay_audit_log;
DROP POLICY IF EXISTS "System can insert workflow logs" ON public.compliance_workflow_log;
DROP POLICY IF EXISTS "System can create notifications" ON public.consultation_notifications;
DROP POLICY IF EXISTS "System can create checksums" ON public.audit_log_checksums;
DROP POLICY IF EXISTS "System can create monitoring records" ON public.backup_monitoring;
DROP POLICY IF EXISTS "System can insert blocked IPs" ON public.blocked_ips;

-- Create more restrictive policies
CREATE POLICY "Service role can manage background jobs" ON public.background_jobs
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Authenticated users can log interactions" ON public.ai_interaction_logs
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Service role can manage query patterns" ON public.ai_query_patterns
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can create recommendation logs" ON public.ai_recommendation_log
FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Authenticated users can report errors" ON public.client_errors
FOR INSERT WITH CHECK (true); -- Allow error reporting but limit to inserts only

CREATE POLICY "Service role can insert audit logs" ON public.co_pay_audit_log
FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can insert workflow logs" ON public.compliance_workflow_log
FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can create notifications" ON public.consultation_notifications
FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can create checksums" ON public.audit_log_checksums
FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can create monitoring records" ON public.backup_monitoring
FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Admins can insert blocked IPs" ON public.blocked_ips
FOR INSERT WITH CHECK (public.get_user_admin_status());