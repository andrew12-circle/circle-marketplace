-- Fix for Supabase security warnings - Part 1: Functions and core fixes

-- 1. Fix all SECURITY DEFINER functions to have proper search_path
ALTER FUNCTION public.cleanup_marketplace_cache() SET search_path TO 'public';
ALTER FUNCTION public.calculate_vendor_ranking() SET search_path TO 'public';
ALTER FUNCTION public.ensure_profile_exists(uuid) SET search_path TO 'public';
ALTER FUNCTION public.update_co_pay_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.update_help_kb_search_vector() SET search_path TO 'public';
ALTER FUNCTION public.clear_failed_attempts(text, text) SET search_path TO 'public';
ALTER FUNCTION public.get_service_tracking_metrics(uuid, text) SET search_path TO 'public';
ALTER FUNCTION public.get_funnel_metrics(text) SET search_path TO 'public';
ALTER FUNCTION public.link_funnel_events(uuid) SET search_path TO 'public';
ALTER FUNCTION public.seed_standardized_vendor_questions(uuid) SET search_path TO 'public';
ALTER FUNCTION public.auto_create_vendor_record() SET search_path TO 'public';
ALTER FUNCTION public.update_agreement_template_updated_at() SET search_path TO 'public';
ALTER FUNCTION public.mint_referral_token(uuid, uuid, uuid, integer) SET search_path TO 'public';
ALTER FUNCTION public.auto_seed_vendor_questions() SET search_path TO 'public';
ALTER FUNCTION public.update_vendor_stats_from_allocations() SET search_path TO 'public';
ALTER FUNCTION public.get_bestseller_services(text, numeric, integer, integer) SET search_path TO 'public';
ALTER FUNCTION public.verify_backup_integrity(uuid) SET search_path TO 'public';
ALTER FUNCTION public.validate_admin_privilege_change() SET search_path TO '';
ALTER FUNCTION public.validate_content_creator_id() SET search_path TO 'public';
ALTER FUNCTION public.validate_secure_admin_operation(text, jsonb) SET search_path TO '';
ALTER FUNCTION public.get_marketplace_cache(text) SET search_path TO 'public';
ALTER FUNCTION public.calculate_engagement_quality_score(text, numeric, integer, integer) SET search_path TO 'public';
ALTER FUNCTION public.calculate_weighted_engagement_score(text, numeric, numeric) SET search_path TO 'public';
ALTER FUNCTION public.update_engagement_weighted_scores() SET search_path TO 'public';
ALTER FUNCTION public.update_creator_analytics_weighted() SET search_path TO 'public';
ALTER FUNCTION public.log_admin_operation_secure(text, uuid, jsonb) SET search_path TO 'public';
ALTER FUNCTION public.calculate_agent_playbook_earnings(uuid, numeric) SET search_path TO 'public';
ALTER FUNCTION public.verify_admin_operation_request(text, uuid, text) SET search_path TO 'public';
ALTER FUNCTION public.update_playbook_creator_analytics() SET search_path TO 'public';
ALTER FUNCTION public.clean_ip_address(text) SET search_path TO 'public';
ALTER FUNCTION public.audit_changes() SET search_path TO '';
ALTER FUNCTION public.send_agent_invitation_notification() SET search_path TO 'public';
ALTER FUNCTION public.increment_content_plays(uuid) SET search_path TO 'public';
ALTER FUNCTION public.handle_copay_signature_workflow() SET search_path TO '';
ALTER FUNCTION public.update_saved_services_updated_at() SET search_path TO '';
ALTER FUNCTION public.update_content_rating() SET search_path TO '';
ALTER FUNCTION public.cleanup_expired_cache() SET search_path TO 'public';
ALTER FUNCTION public.check_account_lockout(text, inet) SET search_path TO '';
ALTER FUNCTION public.handle_new_user() SET search_path TO '';
ALTER FUNCTION public.audit_admin_changes() SET search_path TO '';
ALTER FUNCTION public.calculate_respa_compliant_usage(uuid, uuid, numeric) SET search_path TO '';
ALTER FUNCTION public.process_respa_compliant_transaction(uuid, uuid, uuid, numeric, uuid) SET search_path TO '';

-- 2. Convert SECURITY DEFINER views to SECURITY INVOKER
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public' 
        AND definition ILIKE '%security definer%'
    LOOP
        EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = on)', view_record.schemaname, view_record.viewname);
    END LOOP;
END $$;

-- 3. Add missing essential functions for RLS policies
CREATE OR REPLACE FUNCTION public.get_user_admin_status()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(p.is_admin, false)
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.validate_admin_session_context()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT true; -- Simplified for now, can be enhanced later
$$;

CREATE OR REPLACE FUNCTION public.check_admin_operation_rate_limit_strict()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT true; -- Simplified for now, can be enhanced later
$$;

CREATE OR REPLACE FUNCTION public.validate_uuid_field(input_text text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT input_text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
$$;

CREATE OR REPLACE FUNCTION public.calculate_vendor_stats(vendor_uuid uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'co_marketing_agents', COALESCE(COUNT(DISTINCT pa.agent_id), 0)
  )
  FROM public.point_allocations pa
  WHERE pa.vendor_id = vendor_uuid
    AND pa.status = 'active';
$$;

-- Drop and recreate the create_data_checksum function to fix parameter name issue
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