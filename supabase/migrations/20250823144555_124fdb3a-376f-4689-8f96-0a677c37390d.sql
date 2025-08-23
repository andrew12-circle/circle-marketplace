-- Convert problematic views to functions (recommended approach per Supabase docs)
-- This completely eliminates the Security Definer View warnings

-- Drop the existing views that are causing linter warnings
DROP VIEW IF EXISTS public.vendor_service_analytics CASCADE;
DROP VIEW IF EXISTS public.vendors_with_local_reps CASCADE;

-- Convert vendor_service_analytics to a function
CREATE OR REPLACE FUNCTION public.get_vendor_service_analytics()
RETURNS TABLE (
    vendor_id uuid,
    total_services bigint,
    total_views numeric,
    total_bookings numeric,
    conversion_rate numeric,
    avg_rating numeric,
    total_reviews numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
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
$$;

-- Convert vendors_with_local_reps to a function
CREATE OR REPLACE FUNCTION public.get_vendors_with_local_reps()
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    logo_url text,
    website_url text,
    contact_email text,
    phone text,
    rating numeric,
    review_count integer,
    is_verified boolean,
    location text,
    co_marketing_agents integer,
    campaigns_funded integer,
    created_at timestamptz,
    updated_at timestamptz,
    service_states text[],
    mls_areas text[],
    service_radius_miles numeric,
    parent_vendor_id uuid,
    vendor_type text,
    license_states text[],
    service_zip_codes text[],
    latitude numeric,
    longitude numeric,
    individual_name text,
    individual_title text,
    individual_phone text,
    individual_email text,
    individual_license_number text,
    nmls_id text,
    is_active boolean,
    local_representatives jsonb
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
    SELECT 
        v.id,
        v.name,
        v.description,
        v.logo_url,
        v.website_url,
        v.contact_email,
        v.phone,
        v.rating,
        v.review_count,
        v.is_verified,
        v.location,
        v.co_marketing_agents,
        v.campaigns_funded,
        v.created_at,
        v.updated_at,
        v.service_states,
        v.mls_areas,
        v.service_radius_miles,
        v.parent_vendor_id,
        v.vendor_type,
        v.license_states,
        v.service_zip_codes,
        v.latitude,
        v.longitude,
        v.individual_name,
        v.individual_title,
        v.individual_phone,
        v.individual_email,
        v.individual_license_number,
        v.nmls_id,
        v.is_active,
        CASE
            WHEN v.parent_vendor_id IS NULL 
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
    WHERE v.is_active = true;
$$;

-- Clean up the diagnostic function we created
DROP FUNCTION IF EXISTS public.identify_security_definer_views();