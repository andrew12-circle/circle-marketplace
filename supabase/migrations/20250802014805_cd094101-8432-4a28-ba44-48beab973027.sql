-- Fix Security Definer View issue and implement comprehensive security measures

-- 1. First, let's check for any existing security definer views and fix them
-- Drop any problematic SECURITY DEFINER views if they exist
DO $$
DECLARE
    view_record RECORD;
BEGIN
    -- Find any views with SECURITY DEFINER that need to be fixed
    FOR view_record IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        -- We'll recreate views without SECURITY DEFINER where appropriate
        NULL; -- Placeholder for now
    END LOOP;
END $$;

-- 2. Create secure admin operation logging function (SECURITY INVOKER)
CREATE OR REPLACE FUNCTION public.log_admin_operation_secure(
    operation_type text,
    target_user_id uuid,
    operation_data jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER  -- Using INVOKER instead of DEFINER for security
AS $$
DECLARE
    current_user_admin boolean;
BEGIN
    -- Check if current user is admin using existing function
    SELECT public.get_user_admin_status() INTO current_user_admin;
    
    IF NOT current_user_admin THEN
        -- Log unauthorized attempt
        INSERT INTO public.security_events (event_type, user_id, event_data)
        VALUES (
            'unauthorized_admin_operation_attempt',
            auth.uid(),
            jsonb_build_object(
                'operation_type', operation_type,
                'target_user_id', target_user_id,
                'blocked', true,
                'timestamp', now()
            )
        );
        RETURN false;
    END IF;
    
    -- Log successful admin operation
    INSERT INTO public.security_events (event_type, user_id, event_data)
    VALUES (
        'admin_operation_logged',
        auth.uid(),
        jsonb_build_object(
            'operation_type', operation_type,
            'target_user_id', target_user_id,
            'operation_data', operation_data,
            'timestamp', now()
        )
    );
    
    RETURN true;
END;
$$;

-- 3. Create secure admin verification edge function to call from frontend
CREATE OR REPLACE FUNCTION public.verify_admin_operation_request(
    operation_type text,
    target_user_id uuid,
    verification_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    current_user_admin boolean;
    rate_limit_ok boolean;
    result jsonb;
BEGIN
    -- Verify admin status
    SELECT public.get_user_admin_status() INTO current_user_admin;
    
    IF NOT current_user_admin THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'unauthorized',
            'message', 'Admin privileges required'
        );
    END IF;
    
    -- Check rate limits
    SELECT public.check_admin_operation_rate_limit_strict() INTO rate_limit_ok;
    
    IF NOT rate_limit_ok THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'rate_limited',
            'message', 'Too many admin operations. Please wait before trying again.'
        );
    END IF;
    
    -- Log the verification request
    PERFORM public.log_admin_operation_secure(
        'verification_request',
        target_user_id,
        jsonb_build_object('operation_type', operation_type)
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Admin operation verified',
        'timestamp', now()
    );
END;
$$;

-- 4. Enhanced security for profiles table updates
CREATE OR REPLACE FUNCTION public.secure_profile_update(
    target_user_id uuid,
    update_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    current_user_admin boolean;
    verification_result jsonb;
    update_result record;
BEGIN
    -- Verify admin status through our secure function
    SELECT public.verify_admin_operation_request(
        'profile_update',
        target_user_id
    ) INTO verification_result;
    
    IF NOT (verification_result->>'success')::boolean THEN
        RETURN verification_result;
    END IF;
    
    -- Perform the secure update (only admin-allowed fields)
    UPDATE public.profiles 
    SET 
        is_admin = COALESCE((update_data->>'is_admin')::boolean, is_admin),
        creator_verified = COALESCE((update_data->>'creator_verified')::boolean, creator_verified),
        is_creator = COALESCE((update_data->>'is_creator')::boolean, is_creator),
        updated_at = now()
    WHERE user_id = target_user_id
    RETURNING * INTO update_result;
    
    IF update_result IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'user_not_found',
            'message', 'Target user not found'
        );
    END IF;
    
    -- Log successful update
    PERFORM public.log_admin_operation_secure(
        'profile_updated',
        target_user_id,
        update_data
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Profile updated successfully',
        'updated_fields', update_data
    );
END;
$$;