-- Drop existing function and recreate with proper signature
DROP FUNCTION IF EXISTS public.validate_admin_session_context();

-- Secure public views by adding proper RLS policies and admin self-check function

-- Drop and recreate service_representatives_public view with RLS check
DROP VIEW IF EXISTS public.service_representatives_public;
CREATE VIEW public.service_representatives_public AS
SELECT 
    id,
    vendor_id,
    name,
    title,
    profile_picture_url,
    bio,
    location,
    specialties,
    years_experience,
    website,
    rating,
    reviews_count,
    is_primary,
    sort_order,
    created_at,
    updated_at
FROM public.service_representatives
WHERE is_active = true 
  AND vendor_id IN (
    SELECT id FROM public.vendors 
    WHERE is_active = true 
      AND approval_status IN ('approved', 'auto_approved')
  )
  AND auth.uid() IS NOT NULL; -- Require authentication

-- Update vendor_directory view to be more restrictive
DROP VIEW IF EXISTS public.vendor_directory;
CREATE VIEW public.vendor_directory AS
SELECT 
    id,
    name,
    logo_url,
    rating,
    review_count,
    is_verified,
    is_premium_provider,
    vendor_type,
    created_at,
    updated_at
FROM public.vendors
WHERE is_active = true 
  AND approval_status IN ('approved', 'auto_approved')
  AND auth.uid() IS NOT NULL; -- Explicit auth requirement

-- Secure web_vitals_summary view to admins only
DROP VIEW IF EXISTS public.web_vitals_summary;
CREATE VIEW public.web_vitals_summary AS
SELECT 
    metric_name,
    path,
    COUNT(*) AS sample_count,
    ROUND(AVG(value)::numeric, 2) AS avg_value,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value::double precision)::numeric, 2) AS p50_value,
    ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value::double precision)::numeric, 2) AS p75_value,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value::double precision)::numeric, 2) AS p95_value,
    ROUND((COUNT(CASE WHEN rating = 'good' THEN 1 END)::double precision / COUNT(*)::double precision * 100)::numeric, 2) AS good_percentage,
    DATE_TRUNC('day', created_at) AS date_collected
FROM public.web_vitals
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND public.get_user_admin_status() = true -- Admins only
GROUP BY metric_name, path, DATE_TRUNC('day', created_at)
ORDER BY DATE_TRUNC('day', created_at) DESC, metric_name, path;

-- Create admin self-check diagnostic function
CREATE OR REPLACE FUNCTION public.admin_self_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_profile RECORD;
    admin_status_methods RECORD;
    session_info RECORD;
    result jsonb;
BEGIN
    -- Get current user profile
    SELECT user_id, is_admin, specialties, display_name, created_at
    INTO current_user_profile
    FROM public.profiles 
    WHERE user_id = auth.uid();
    
    -- Check different admin verification methods
    SELECT 
        public.get_user_admin_status() as function_check,
        CASE WHEN current_user_profile.is_admin = true THEN true ELSE false END as profile_is_admin,
        CASE WHEN 'admin' = ANY(current_user_profile.specialties) THEN true ELSE false END as specialties_admin
    INTO admin_status_methods;
    
    -- Get session info safely
    BEGIN
        SELECT 
            auth.uid() as user_id,
            auth.jwt()->>'role' as jwt_role,
            auth.jwt()->>'aud' as jwt_audience,
            CASE 
                WHEN auth.jwt()->>'exp' IS NOT NULL THEN
                    EXTRACT(EPOCH FROM (TO_TIMESTAMP((auth.jwt()->>'exp')::int) - NOW()))
                ELSE 0
            END as jwt_expires_in_seconds
        INTO session_info;
    EXCEPTION
        WHEN OTHERS THEN
            session_info.user_id := auth.uid();
            session_info.jwt_role := 'unknown';
            session_info.jwt_audience := 'unknown';
            session_info.jwt_expires_in_seconds := 0;
    END;
    
    -- Build comprehensive result
    result := jsonb_build_object(
        'timestamp', NOW(),
        'user_authenticated', auth.uid() IS NOT NULL,
        'user_id', session_info.user_id,
        'profile_exists', current_user_profile.user_id IS NOT NULL,
        'admin_checks', jsonb_build_object(
            'function_result', COALESCE(admin_status_methods.function_check, false),
            'profile_is_admin', COALESCE(admin_status_methods.profile_is_admin, false),
            'specialties_admin', COALESCE(admin_status_methods.specialties_admin, false),
            'any_admin_method', COALESCE(
                admin_status_methods.function_check = true OR
                admin_status_methods.profile_is_admin = true OR
                admin_status_methods.specialties_admin = true,
                false
            )
        ),
        'profile_data', jsonb_build_object(
            'display_name', current_user_profile.display_name,
            'is_admin', current_user_profile.is_admin,
            'specialties', COALESCE(current_user_profile.specialties, '{}'),
            'created_at', current_user_profile.created_at
        ),
        'session_info', jsonb_build_object(
            'jwt_role', session_info.jwt_role,
            'jwt_audience', session_info.jwt_audience,
            'jwt_expires_in_seconds', session_info.jwt_expires_in_seconds,
            'session_valid', session_info.jwt_expires_in_seconds > 0
        ),
        'security_status', jsonb_build_object(
            'can_access_admin_functions', public.get_user_admin_status(),
            'rls_enabled_on_profiles', (
                SELECT COUNT(*) > 0 
                FROM pg_policies 
                WHERE schemaname = 'public' 
                  AND tablename = 'profiles'
            )
        )
    );
    
    -- Log this diagnostic check (only if security_events table exists)
    BEGIN
        INSERT INTO public.security_events (event_type, user_id, event_data)
        VALUES (
            'admin_self_check_performed',
            auth.uid(),
            result
        );
    EXCEPTION
        WHEN OTHERS THEN
            -- Ignore if security_events table doesn't exist
            NULL;
    END;
    
    RETURN result;
END;
$$;

-- Create admin session validation function for frontend use
CREATE OR REPLACE FUNCTION public.validate_admin_session_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    is_admin boolean;
    session_valid boolean;
    result jsonb;
BEGIN
    -- Quick admin check
    SELECT public.get_user_admin_status() INTO is_admin;
    
    -- Basic session validation
    session_valid := auth.uid() IS NOT NULL;
    
    result := jsonb_build_object(
        'is_admin', COALESCE(is_admin, false),
        'session_valid', session_valid,
        'user_id', auth.uid(),
        'timestamp', NOW()
    );
    
    -- Log validation if admin (only if security_events table exists)
    IF COALESCE(is_admin, false) THEN
        BEGIN
            INSERT INTO public.security_events (event_type, user_id, event_data)
            VALUES (
                'admin_session_validated',
                auth.uid(),
                jsonb_build_object(
                    'validation_result', result,
                    'ip_address', COALESCE(inet_client_addr()::text, 'unknown')
                )
            );
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignore if security_events table doesn't exist
                NULL;
        END;
    END IF;
    
    RETURN result;
END;
$$;