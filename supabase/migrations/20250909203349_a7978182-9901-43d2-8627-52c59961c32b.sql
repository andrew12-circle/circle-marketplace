-- Create the get_admin_stats function that the admin overview needs
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    -- Get admin statistics
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM public.profiles),
        'admin_users', (SELECT COUNT(*) FROM public.profiles WHERE is_admin = true),
        'pro_users', (SELECT COUNT(*) FROM public.profiles WHERE is_pro = true),
        'verified_users', (SELECT COUNT(*) FROM public.profiles WHERE email_verified = true),
        'total_services', (SELECT COUNT(*) FROM public.services WHERE status = 'active'),
        'total_vendors', (SELECT COUNT(DISTINCT vendor_id) FROM public.services WHERE vendor_id IS NOT NULL),
        'new_users_this_week', (
            SELECT COUNT(*) 
            FROM public.profiles 
            WHERE created_at >= NOW() - INTERVAL '7 days'
        ),
        'last_updated', NOW()
    ) INTO result;

    RETURN result;
END;
$$;