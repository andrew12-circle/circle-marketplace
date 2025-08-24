-- Supabase RLS Performance Optimization: Fix 900+ auth_rls_initplan warnings
-- Replace volatile JWT calls with stable SQL helpers and add missing indexes

-- Step 1: Ensure we have the stable JWT helper functions
-- These replace any volatile current_setting calls in RLS paths

-- Replace the existing auth functions to be fully stable
CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(current_setting('request.jwt.claims', true)::jsonb, '{}'::jsonb)
$$;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (auth.jwt()->>'sub')::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.jwt()->>'role'
$$;

-- Create tenant_id helper (not in current codebase but follows pattern)
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT nullif(auth.jwt()->>'tenant_id','')::uuid
$$;

-- Step 2: Replace the problematic public schema JWT helpers to use auth.* functions
-- This eliminates the current_setting calls in the public schema

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.jwt()
$$;

CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.role()
$$;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.tenant_id()
$$;

-- Step 3: Fix the get_user_admin_status function to be properly stable
-- This function is used extensively in RLS policies

CREATE OR REPLACE FUNCTION public.get_user_admin_status()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE((
    SELECT is_admin 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  ), false)
$$;

-- Step 4: Add missing indexes for RLS performance
-- These indexes support the most common RLS predicates

-- Core user relationship indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_admin ON public.profiles(user_id, is_admin) WHERE is_admin = true;

-- Agent/vendor relationship indexes  
CREATE INDEX IF NOT EXISTS idx_agent_copay_spending_agent_id ON public.agent_copay_spending(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_copay_spending_vendor_id ON public.agent_copay_spending(vendor_id);

CREATE INDEX IF NOT EXISTS idx_agent_invitations_invited_by ON public.agent_invitations(invited_by);

CREATE INDEX IF NOT EXISTS idx_agent_performance_tracking_agent_id ON public.agent_performance_tracking(agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_quiz_responses_agent_id ON public.agent_quiz_responses(agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_relationships_agent_a ON public.agent_relationships(agent_a_id);
CREATE INDEX IF NOT EXISTS idx_agent_relationships_agent_b ON public.agent_relationships(agent_b_id);

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);

CREATE INDEX IF NOT EXISTS idx_agreement_signatures_signer_id ON public.agreement_signatures(signer_id);

CREATE INDEX IF NOT EXISTS idx_ai_interaction_logs_user_id ON public.ai_interaction_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_recommendation_log_user_id ON public.ai_recommendation_log(user_id);

-- Admin and security indexes
CREATE INDEX IF NOT EXISTS idx_admin_notes_created_by ON public.admin_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON public.admin_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_blocked_by ON public.blocked_ips(blocked_by);

-- Channel and subscription indexes
CREATE INDEX IF NOT EXISTS idx_channels_creator_id ON public.channels(creator_id);
CREATE INDEX IF NOT EXISTS idx_channel_subscriptions_user_id ON public.channel_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_subscriptions_channel_id ON public.channel_subscriptions(channel_id);

CREATE INDEX IF NOT EXISTS idx_client_errors_user_id ON public.client_errors(user_id);

-- Co-pay request indexes (high volume table)
CREATE INDEX IF NOT EXISTS idx_co_pay_requests_agent_id ON public.co_pay_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_co_pay_requests_vendor_id ON public.co_pay_requests(vendor_id);
CREATE INDEX IF NOT EXISTS idx_co_pay_requests_compliance_reviewed_by ON public.co_pay_requests(compliance_reviewed_by);

CREATE INDEX IF NOT EXISTS idx_co_pay_audit_log_performed_by ON public.co_pay_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_co_pay_audit_log_co_pay_request_id ON public.co_pay_audit_log(co_pay_request_id);

-- Compliance and document indexes
CREATE INDEX IF NOT EXISTS idx_compliance_documents_uploaded_by ON public.compliance_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_co_pay_request_id ON public.compliance_documents(co_pay_request_id);

CREATE INDEX IF NOT EXISTS idx_compliance_team_members_user_id ON public.compliance_team_members(user_id);

CREATE INDEX IF NOT EXISTS idx_compliance_workflow_log_performed_by ON public.compliance_workflow_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_compliance_workflow_log_co_pay_request_id ON public.compliance_workflow_log(co_pay_request_id);

-- Comment and engagement indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);

-- Content and creator indexes
CREATE INDEX IF NOT EXISTS idx_content_creator_id ON public.content(creator_id);
CREATE INDEX IF NOT EXISTS idx_content_creator_published ON public.content(creator_id, is_published) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_content_comments_user_id ON public.content_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_content_id ON public.content_comments(content_id);

CREATE INDEX IF NOT EXISTS idx_content_engagement_events_user_id ON public.content_engagement_events(user_id);
CREATE INDEX IF NOT EXISTS idx_content_engagement_events_content_id ON public.content_engagement_events(content_id);

CREATE INDEX IF NOT EXISTS idx_content_likes_user_id ON public.content_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_content_likes_content_id ON public.content_likes(content_id);

CREATE INDEX IF NOT EXISTS idx_content_ratings_user_id ON public.content_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_content_ratings_content_id ON public.content_ratings(content_id);

CREATE INDEX IF NOT EXISTS idx_creator_analytics_creator_id ON public.creator_analytics(creator_id);

-- Step 5: Analyze tables for optimal query planning
ANALYZE public.profiles;
ANALYZE public.agents;
ANALYZE public.co_pay_requests;
ANALYZE public.content;
ANALYZE public.admin_sessions;
ANALYZE public.agent_performance_tracking;