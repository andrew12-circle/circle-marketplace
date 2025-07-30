-- Fix the security definer view issue
-- The vendors_with_local_reps view needs to be recreated without security definer
-- First drop the existing view
DROP VIEW IF EXISTS public.vendors_with_local_reps;

-- Recreate the view without security definer (it will use invoker rights by default)
CREATE VIEW public.vendors_with_local_reps AS
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
    COALESCE(
        json_agg(
            json_build_object(
                'id', lr.id, 
                'name', lr.individual_name, 
                'title', lr.individual_title, 
                'phone', lr.individual_phone, 
                'email', lr.individual_email, 
                'license_number', lr.individual_license_number, 
                'location', lr.location
            )
        ) FILTER (WHERE lr.id IS NOT NULL), 
        '[]'::json
    ) AS local_representatives
FROM vendors v
LEFT JOIN vendors lr ON (
    lr.parent_vendor_id = v.id 
    AND lr.vendor_type = 'individual'
)
WHERE (
    v.vendor_type = 'company' 
    OR v.parent_vendor_id IS NULL
)
GROUP BY v.id;