-- Fix the get_admin_stats function to only reference existing columns
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
SET search_path TO public
AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if user is admin
    IF NOT get_user_admin_status() THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Get admin statistics using only existing columns
    SELECT json_build_object(
        'total_users', COALESCE((SELECT COUNT(*) FROM public.profiles), 0),
        'admin_users', COALESCE((SELECT COUNT(*) FROM public.profiles WHERE is_admin = true), 0),
        'pro_users', COALESCE((SELECT COUNT(*) FROM public.profiles WHERE is_pro = true), 0),
        'verified_users', COALESCE((SELECT COUNT(*) FROM public.profiles WHERE email_verified = true), 0),
        'total_services', COALESCE((SELECT COUNT(*) FROM public.services WHERE is_active = true), 0),
        'total_vendors', COALESCE((SELECT COUNT(*) FROM public.vendors WHERE is_active = true), 0),
        'new_users_this_week', COALESCE((
            SELECT COUNT(*) 
            FROM public.profiles 
            WHERE created_at >= NOW() - INTERVAL '7 days'
        ), 0),
        'last_updated', NOW()
    ) INTO result;

    RETURN result;
END;
$$;