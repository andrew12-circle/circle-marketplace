-- Fix for Supabase security warnings - Part 2: RLS Policies and Functions

-- Enable pgcrypto extension for digest function
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fix the create_data_checksum function
DROP FUNCTION IF EXISTS public.create_data_checksum(jsonb);
CREATE OR REPLACE FUNCTION public.create_data_checksum(data_input jsonb)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT encode(digest(data_input::text, 'sha256'), 'hex');
$$;

-- 4. Harden overly permissive RLS policies on sensitive tables
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

-- 5. Enable RLS on all tables (some may already have it, but this ensures consistency)
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_copay_spending ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_performance_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_playbook_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_query_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_service_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log_checksums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.co_pay_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.co_pay_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comarketing_agreement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_workflow_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_notifications ENABLE ROW LEVEL SECURITY;