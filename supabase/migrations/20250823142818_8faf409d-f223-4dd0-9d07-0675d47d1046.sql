-- Fix Supabase security linter warnings

-- 1. Fix RLS enabled tables with no policies (INFO level)
-- Add restrictive default policies for tables that have RLS enabled but no policies

-- Check if any tables need default restrictive policies
-- These would be tables with RLS enabled but no existing policies

-- 2. Fix Security Definer Views (ERROR level)
-- Convert any security definer views to regular functions
-- Note: We need to identify these views first and convert them

-- 3. Fix Function Search Path Mutable (WARN level)
-- Add explicit search_path to all functions missing it

-- Update functions to include SET search_path TO 'public'
-- This fixes the mutable search_path warnings

-- Update all functions that don't already have search_path set
ALTER FUNCTION public.cleanup_marketplace_cache() SET search_path TO 'public';
ALTER FUNCTION public.get_trending_services(text, numeric, integer, integer) SET search_path TO 'public';
ALTER FUNCTION public.ensure_profile_exists(uuid) SET search_path TO 'public';
ALTER FUNCTION public.update_co_pay_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_help_kb_search_vector() SET search_path TO 'public';
ALTER FUNCTION public.get_service_tracking_metrics(uuid, text) SET search_path TO 'public';
ALTER FUNCTION public.link_funnel_events(uuid) SET search_path TO 'public';
ALTER FUNCTION public.get_funnel_metrics(text) SET search_path TO 'public';
ALTER FUNCTION public.calculate_vendor_ranking() SET search_path TO 'public';
ALTER FUNCTION public.seed_standardized_vendor_questions(uuid) SET search_path TO 'public';
ALTER FUNCTION public.auto_create_vendor_record() SET search_path TO 'public';
ALTER FUNCTION public.mint_referral_token(uuid, uuid, uuid, integer) SET search_path TO 'public';
ALTER FUNCTION public.auto_seed_vendor_questions() SET search_path TO 'public';
ALTER FUNCTION public.update_vendor_stats_from_allocations() SET search_path TO 'public';
ALTER FUNCTION public.get_bestseller_services(text, numeric, integer, integer) SET search_path TO 'public';
ALTER FUNCTION public.warm_marketplace_cache() SET search_path TO 'public';
ALTER FUNCTION public.get_marketplace_cache(text) SET search_path TO 'public';
ALTER FUNCTION public.get_creator_earnings_summary(uuid) SET search_path TO 'public';
ALTER FUNCTION public.check_agent_vendor_match(uuid, uuid) SET search_path TO 'public';
ALTER FUNCTION public.validate_admin_session_context() SET search_path TO 'public';
ALTER FUNCTION public.get_service_rating_stats(uuid) SET search_path TO 'public';
ALTER FUNCTION public.calculate_vendor_stats(uuid) SET search_path TO 'public';
ALTER FUNCTION public.validate_consultation_emails_trigger() SET search_path TO 'public';
ALTER FUNCTION public.update_all_vendor_stats() SET search_path TO 'public';
ALTER FUNCTION public.playbook_ai_draft_section(jsonb, text, jsonb) SET search_path TO 'public';
ALTER FUNCTION public.validate_admin_session(text) SET search_path TO 'public';
ALTER FUNCTION public.seed_vendor_questions(uuid) SET search_path TO 'public';
ALTER FUNCTION public.secure_profile_update(uuid, jsonb) SET search_path TO 'public';
ALTER FUNCTION public.clear_failed_attempts(text, text) SET search_path TO 'public';
ALTER FUNCTION public.update_vendor_stats_trigger() SET search_path TO 'public';
ALTER FUNCTION public.get_enhanced_creator_info(uuid) SET search_path TO 'public';
ALTER FUNCTION public.log_compliance_workflow_change() SET search_path TO 'public';
ALTER FUNCTION public.check_admin_operation_rate_limit_strict() SET search_path TO 'public';
ALTER FUNCTION public.update_comment_likes_count() SET search_path TO 'public';
ALTER FUNCTION public.update_agreement_template_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_creator_analytics() SET search_path TO 'public';
ALTER FUNCTION public.calculate_monthly_payouts(text) SET search_path TO 'public';
ALTER FUNCTION public.update_updated_at_column() SET search_path TO 'public';
ALTER FUNCTION public.validate_uuid_field(text) SET search_path TO 'public';
ALTER FUNCTION public.verify_backup_integrity(uuid) SET search_path TO 'public';
ALTER FUNCTION public.validate_channels_creator_id() SET search_path TO 'public';
ALTER FUNCTION public.create_data_checksum(jsonb) SET search_path TO 'public';

-- Fix any remaining issues by checking for tables with RLS but no policies
-- Get list of tables with RLS enabled but no policies (if any)
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- Look for tables with RLS enabled but no policies
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            SELECT tablename 
            FROM pg_tables t
            WHERE t.schemaname = 'public'
            AND EXISTS (
                SELECT 1 FROM pg_class c 
                JOIN pg_namespace n ON n.oid = c.relnamespace 
                WHERE c.relname = t.tablename 
                AND n.nspname = 'public' 
                AND c.relrowsecurity = true
            )
            AND NOT EXISTS (
                SELECT 1 FROM pg_policies p 
                WHERE p.schemaname = 'public' 
                AND p.tablename = t.tablename
            )
        )
    LOOP
        -- Add a restrictive default policy for tables with RLS but no policies
        EXECUTE format('CREATE POLICY "%s_default_deny" ON public.%I FOR ALL USING (false)', 
                      table_record.tablename, table_record.tablename);
    END LOOP;
END $$;

-- Note: Security Definer Views need to be identified and converted manually
-- The linter will show which specific views need to be addressed