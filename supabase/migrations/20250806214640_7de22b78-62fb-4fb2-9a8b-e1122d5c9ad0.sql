-- Drop the duplicate co_pay_allowed column (with underscore)
ALTER TABLE public.services DROP COLUMN IF EXISTS co_pay_allowed;

-- Update the get_optimized_marketplace_data function to use copay_allowed (without underscore)
CREATE OR REPLACE FUNCTION public.get_optimized_marketplace_data()
 RETURNS TABLE(service_id uuid, service_title text, service_description text, service_category text, service_discount_percentage text, service_retail_price text, service_pro_price text, service_co_pay_price text, service_image_url text, service_tags text[], service_is_featured boolean, service_is_top_pick boolean, service_estimated_roi integer, service_duration text, service_requires_quote boolean, service_sort_order integer, service_copay_allowed boolean, vendor_id uuid, vendor_name text, vendor_rating numeric, vendor_review_count integer, vendor_is_verified boolean, vendor_description text, vendor_logo_url text, vendor_website_url text, vendor_location text, vendor_co_marketing_agents integer, vendor_campaigns_funded integer, vendor_service_states text[], vendor_mls_areas text[], vendor_service_radius_miles integer, vendor_license_states text[], vendor_latitude numeric, vendor_longitude numeric, vendor_type text, vendor_local_representatives jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as service_id,
    s.title as service_title,
    s.description as service_description,
    s.category as service_category,
    s.discount_percentage as service_discount_percentage,
    s.retail_price as service_retail_price,
    s.pro_price as service_pro_price,
    s.co_pay_price as service_co_pay_price,
    s.image_url as service_image_url,
    s.tags as service_tags,
    s.is_featured as service_is_featured,
    s.is_top_pick as service_is_top_pick,
    s.estimated_roi as service_estimated_roi,
    s.duration as service_duration,
    s.requires_quote as service_requires_quote,
    s.sort_order as service_sort_order,
    s.copay_allowed as service_copay_allowed,
    v.id as vendor_id,
    COALESCE(v.name, 'Circle Marketplace') as vendor_name,
    COALESCE(v.rating, 0) as vendor_rating,
    COALESCE(v.review_count, 0) as vendor_review_count,
    COALESCE(v.is_verified, false) as vendor_is_verified,
    v.description as vendor_description,
    v.logo_url as vendor_logo_url,
    v.website_url as vendor_website_url,
    v.location as vendor_location,
    COALESCE(v.co_marketing_agents, 0) as vendor_co_marketing_agents,
    COALESCE(v.campaigns_funded, 0) as vendor_campaigns_funded,
    v.service_states as vendor_service_states,
    v.mls_areas as vendor_mls_areas,
    v.service_radius_miles as vendor_service_radius_miles,
    v.license_states as vendor_license_states,
    v.latitude as vendor_latitude,
    v.longitude as vendor_longitude,
    v.vendor_type as vendor_type,
    v.local_representatives as vendor_local_representatives
  FROM public.services s
  LEFT JOIN public.vendors v ON s.vendor_id = v.id
  ORDER BY 
    s.sort_order ASC NULLS LAST,
    s.is_featured DESC,
    s.is_top_pick DESC,
    s.created_at DESC;
END;
$function$