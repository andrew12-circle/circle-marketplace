-- Fix security definer view issue by recreating without SECURITY DEFINER
DROP VIEW IF EXISTS public.vendors_with_local_reps;

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
  CASE
    WHEN v.vendor_type = 'individual' THEN 
      jsonb_build_array(
        jsonb_build_object(
          'name', v.individual_name,
          'title', v.individual_title, 
          'phone', v.individual_phone,
          'email', v.individual_email,
          'license_number', v.individual_license_number
        )
      )
    ELSE '[]'::jsonb
  END AS local_representatives
FROM public.vendors v
WHERE v.is_active = true;