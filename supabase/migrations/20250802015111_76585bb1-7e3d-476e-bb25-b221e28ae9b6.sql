-- Final fix for Security Definer View - check system catalogs directly

-- Find and drop any remaining SECURITY DEFINER views by checking system catalogs
DO $$
DECLARE
    view_rec RECORD;
    view_oid OID;
    view_options TEXT[];
BEGIN
    -- Check system catalogs for views with security_definer option
    FOR view_rec IN 
        SELECT 
            n.nspname as schema_name, 
            c.relname as view_name,
            c.oid as view_oid
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'v' -- views only
        AND n.nspname = 'public'
    LOOP
        -- Check if this view has security_definer option
        SELECT reloptions INTO view_options
        FROM pg_class 
        WHERE oid = view_rec.view_oid;
        
        -- If view has security_definer option, drop it
        IF view_options IS NOT NULL AND 'security_definer=true' = ANY(view_options) THEN
            RAISE NOTICE 'Dropping SECURITY DEFINER view: %.%', view_rec.schema_name, view_rec.view_name;
            EXECUTE format('DROP VIEW %I.%I CASCADE', view_rec.schema_name, view_rec.view_name);
        END IF;
    END LOOP;
END $$;

-- Ensure our vendor_service_analytics view exists without SECURITY DEFINER
DROP VIEW IF EXISTS public.vendor_service_analytics CASCADE;

-- Recreate the analytics view properly (no SECURITY DEFINER)
CREATE VIEW public.vendor_service_analytics AS
SELECT 
    s.vendor_id,
    s.id as service_id,
    s.title as service_title,
    COALESCE(view_stats.view_count, 0) as total_views,
    COALESCE(booking_stats.booking_count, 0) as total_bookings,
    CASE 
        WHEN COALESCE(view_stats.view_count, 0) > 0 
        THEN ROUND((COALESCE(booking_stats.booking_count, 0)::numeric / view_stats.view_count::numeric) * 100, 2)
        ELSE 0 
    END as conversion_rate,
    COALESCE(review_stats.avg_rating, 0) as avg_rating,
    COALESCE(review_stats.review_count, 0) as total_reviews,
    s.created_at,
    s.updated_at
FROM public.services s
LEFT JOIN (
    SELECT service_id, COUNT(*) as view_count
    FROM public.service_views 
    GROUP BY service_id
) view_stats ON s.id = view_stats.service_id
LEFT JOIN (
    SELECT service_id, COUNT(*) as booking_count
    FROM public.consultation_bookings 
    GROUP BY service_id
) booking_stats ON s.id = booking_stats.service_id
LEFT JOIN (
    SELECT service_id, AVG(rating) as avg_rating, COUNT(*) as review_count
    FROM public.service_reviews 
    GROUP BY service_id
) review_stats ON s.id = review_stats.service_id;

-- Grant appropriate permissions
GRANT SELECT ON public.vendor_service_analytics TO authenticator;

-- Double-check no more SECURITY DEFINER views exist
DO $$
BEGIN
    -- Final verification
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relkind = 'v' 
        AND n.nspname = 'public'
        AND 'security_definer=true' = ANY(c.reloptions)
    ) THEN
        RAISE EXCEPTION 'Still have SECURITY DEFINER views remaining';
    ELSE
        RAISE NOTICE 'All SECURITY DEFINER views have been resolved';
    END IF;
END $$;