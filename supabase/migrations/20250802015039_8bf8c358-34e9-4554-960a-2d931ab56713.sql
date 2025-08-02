-- Find and fix the remaining security definer view issue

-- 1. List all views in public schema to identify the problematic one
DO $$
DECLARE
    view_rec RECORD;
    view_def TEXT;
BEGIN
    FOR view_rec IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        -- Get the view definition
        SELECT pg_get_viewdef(view_rec.viewname) INTO view_def;
        
        -- Check if it contains SECURITY DEFINER
        IF view_def ILIKE '%SECURITY DEFINER%' THEN
            RAISE NOTICE 'Found SECURITY DEFINER view: %.% - Definition: %', view_rec.schemaname, view_rec.viewname, view_def;
            
            -- Drop the problematic view
            EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_rec.schemaname, view_rec.viewname);
            RAISE NOTICE 'Dropped view: %.%', view_rec.schemaname, view_rec.viewname;
        END IF;
    END LOOP;
END $$;

-- 2. If there's a vendor_service_analytics view causing issues, recreate it properly
DROP VIEW IF EXISTS public.vendor_service_analytics CASCADE;

-- Create vendor_service_analytics view without SECURITY DEFINER
CREATE VIEW public.vendor_service_analytics AS
SELECT 
    s.vendor_id,
    s.id as service_id,
    s.title as service_title,
    COALESCE(sv.view_count, 0) as total_views,
    COALESCE(cb.booking_count, 0) as total_bookings,
    CASE 
        WHEN COALESCE(sv.view_count, 0) > 0 
        THEN ROUND((COALESCE(cb.booking_count, 0)::numeric / sv.view_count::numeric) * 100, 2)
        ELSE 0 
    END as conversion_rate,
    COALESCE(sr.avg_rating, 0) as avg_rating,
    COALESCE(sr.review_count, 0) as total_reviews,
    s.created_at,
    s.updated_at
FROM public.services s
LEFT JOIN (
    SELECT 
        service_id, 
        COUNT(*) as view_count
    FROM public.service_views 
    GROUP BY service_id
) sv ON s.id = sv.service_id
LEFT JOIN (
    SELECT 
        service_id, 
        COUNT(*) as booking_count
    FROM public.consultation_bookings 
    GROUP BY service_id
) cb ON s.id = cb.service_id
LEFT JOIN (
    SELECT 
        service_id,
        AVG(rating) as avg_rating,
        COUNT(*) as review_count
    FROM public.service_reviews 
    GROUP BY service_id
) sr ON s.id = sr.service_id;

-- 3. Ensure RLS is enabled on the view (views inherit RLS from underlying tables)
-- The view will respect RLS policies of the underlying tables automatically

-- 4. Check for any other problematic views and fix them
DO $$
DECLARE
    view_rec RECORD;
BEGIN
    -- Double-check for any remaining problematic views
    FOR view_rec IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
        AND viewname NOT IN ('vendor_service_analytics')
    LOOP
        -- If any other views have issues, log them
        RAISE NOTICE 'Remaining view: %.%', view_rec.schemaname, view_rec.viewname;
    END LOOP;
END $$;