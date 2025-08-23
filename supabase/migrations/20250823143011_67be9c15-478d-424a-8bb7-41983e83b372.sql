-- Fix the actual security issue: recreate views to ensure they don't have SECURITY DEFINER
-- The linter is detecting views that may have been created with security definer attributes

-- Drop and recreate views to ensure they're clean
DROP VIEW IF EXISTS public.vendor_service_analytics CASCADE;
DROP VIEW IF EXISTS public.vendors_with_local_reps CASCADE;

-- Recreate vendor_service_analytics view (without any security definer attributes)
CREATE VIEW public.vendor_service_analytics AS
SELECT DISTINCT 
    s.vendor_id,
    count(s.id) AS total_services,
    COALESCE(sum(sv.view_count), 0::numeric) AS total_views,
    COALESCE(sum(cb.booking_count), 0::numeric) AS total_bookings,
    CASE
        WHEN sum(sv.view_count) > 0::numeric 
        THEN round((sum(cb.booking_count) / sum(sv.view_count)) * 100::numeric, 2)
        ELSE 0::numeric
    END AS conversion_rate,
    COALESCE(avg(s.rating), 0::numeric) AS avg_rating,
    COALESCE(sum(sr.review_count), 0::numeric) AS total_reviews
FROM services s
LEFT JOIN (
    SELECT service_views.service_id,
           count(*) AS view_count
    FROM service_views
    GROUP BY service_views.service_id
) sv ON s.id = sv.service_id
LEFT JOIN (
    SELECT consultation_bookings.service_id,
           count(*) AS booking_count
    FROM consultation_bookings
    GROUP BY consultation_bookings.service_id
) cb ON s.id = cb.service_id
LEFT JOIN (
    SELECT service_reviews.service_id,
           count(*) AS review_count
    FROM service_reviews
    GROUP BY service_reviews.service_id
) sr ON s.id = sr.service_id
GROUP BY s.vendor_id;

-- Recreate vendors_with_local_reps view (without any security definer attributes)
CREATE VIEW public.vendors_with_local_reps AS
SELECT 
    id,
    name,
    description,
    logo_url,
    website_url,
    contact_email,
    phone,
    rating,
    review_count,
    is_verified,
    location,
    co_marketing_agents,
    campaigns_funded,
    created_at,
    updated_at,
    service_states,
    mls_areas,
    service_radius_miles,
    parent_vendor_id,
    vendor_type,
    license_states,
    service_zip_codes,
    latitude,
    longitude,
    individual_name,
    individual_title,
    individual_phone,
    individual_email,
    individual_license_number,
    nmls_id,
    is_active,
    CASE
        WHEN parent_vendor_id IS NULL 
        THEN COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', child.id,
                'name', child.individual_name,
                'title', child.individual_title,
                'phone', child.individual_phone,
                'email', child.individual_email,
                'license_number', child.individual_license_number,
                'location', child.location
            ))
            FROM vendors child
            WHERE child.parent_vendor_id = v.id 
            AND child.is_active = true
        ), '[]'::jsonb)
        ELSE '[]'::jsonb
    END AS local_representatives
FROM vendors v
WHERE is_active = true;