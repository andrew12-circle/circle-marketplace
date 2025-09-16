-- Fix the RPC functions with correct columns and data types
CREATE OR REPLACE FUNCTION public.svc_save_core_patch(
  p_id uuid,
  p_patch jsonb,
  p_version integer DEFAULT 1
) RETURNS TABLE(id uuid, core_version integer, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_version integer;
  filtered_patch jsonb := '{}';
  key text;
  -- Only include actual columns that exist in services table (excluding funnel-specific ones)
  valid_columns text[] := ARRAY[
    'title', 'description', 'category', 'discount_percentage', 'image_url', 'profile_image_url',
    'website_url', 'retail_price', 'pro_price', 'co_pay_price', 'price_duration', 
    'estimated_roi', 'duration', 'setup_time', 'tags', 'rating', 'requires_quote',
    'is_featured', 'is_top_pick', 'is_verified', 'is_active', 'is_affiliate', 'is_booking_link',
    'direct_purchase_enabled', 'service_provider_id', 'sort_order', 'copay_allowed', 
    'respa_split_limit', 'max_split_percentage_non_ssp', 'is_respa_regulated', 'respa_risk_level',
    'respa_compliance_notes', 'compliance_checklist', 'regulatory_findings', 'supporting_documents',
    'disclaimer_id', 'calendar_link', 'consultation_email', 'consultation_phone', 'request_pricing',
    'pricing_screenshot_url', 'pricing_screenshot_captured_at', 'pricing_page_url',
    'is_sponsored', 'sponsored_rank_boost', 'is_published', 'average_rating', 'booking_type',
    'external_booking_provider', 'external_booking_url', 'booking_time_rules', 'sync_to_ghl',
    'consultation_emails', 'disclaimer_content', 'allowed_split_percentage', 'title_es', 'title_fr',
    'description_es', 'description_fr', 'ssp_allowed', 'max_split_percentage_ssp', 'default_package_id'
  ];
BEGIN
  -- Get current version
  SELECT services.core_version INTO current_version 
  FROM services WHERE services.id = p_id;
  
  IF current_version IS NULL THEN
    RAISE EXCEPTION 'Service not found: %', p_id;
  END IF;
  
  -- Check version conflict
  IF current_version != p_version THEN
    RAISE EXCEPTION 'VERSION_CONFLICT: Expected version %, got %', p_version, current_version;
  END IF;
  
  -- Filter patch to only include valid columns (exclude funnel data)
  FOR key IN SELECT jsonb_object_keys(p_patch) LOOP
    IF key = ANY(valid_columns) THEN
      filtered_patch := filtered_patch || jsonb_build_object(key, p_patch->key);
    END IF;
  END LOOP;
  
  -- Skip if no valid changes
  IF filtered_patch = '{}' THEN
    RETURN QUERY
    SELECT services.id, services.core_version, services.updated_at
    FROM services WHERE services.id = p_id;
    RETURN;
  END IF;
  
  -- Dynamic update using filtered patch
  UPDATE services 
  SET 
    title = COALESCE((filtered_patch->>'title'), title),
    description = COALESCE((filtered_patch->>'description'), description),
    category = COALESCE((filtered_patch->>'category'), category),
    discount_percentage = COALESCE((filtered_patch->>'discount_percentage'), discount_percentage),
    image_url = COALESCE((filtered_patch->>'image_url'), image_url),
    profile_image_url = COALESCE((filtered_patch->>'profile_image_url'), profile_image_url),
    website_url = COALESCE((filtered_patch->>'website_url'), website_url),
    retail_price = COALESCE((filtered_patch->>'retail_price'), retail_price),
    pro_price = COALESCE((filtered_patch->>'pro_price'), pro_price),
    co_pay_price = COALESCE((filtered_patch->>'co_pay_price'), co_pay_price),
    price_duration = COALESCE((filtered_patch->>'price_duration'), price_duration),
    estimated_roi = COALESCE((filtered_patch->>'estimated_roi')::numeric, estimated_roi),
    duration = COALESCE((filtered_patch->>'duration'), duration),
    setup_time = COALESCE((filtered_patch->>'setup_time'), setup_time),
    tags = COALESCE((filtered_patch->>'tags')::text[], tags),
    rating = COALESCE((filtered_patch->>'rating')::numeric, rating),
    requires_quote = COALESCE((filtered_patch->>'requires_quote')::boolean, requires_quote),
    is_featured = COALESCE((filtered_patch->>'is_featured')::boolean, is_featured),
    is_top_pick = COALESCE((filtered_patch->>'is_top_pick')::boolean, is_top_pick),
    is_verified = COALESCE((filtered_patch->>'is_verified')::boolean, is_verified),
    is_active = COALESCE((filtered_patch->>'is_active')::boolean, is_active),
    is_affiliate = COALESCE((filtered_patch->>'is_affiliate')::boolean, is_affiliate),
    is_booking_link = COALESCE((filtered_patch->>'is_booking_link')::boolean, is_booking_link),
    direct_purchase_enabled = COALESCE((filtered_patch->>'direct_purchase_enabled')::boolean, direct_purchase_enabled),
    service_provider_id = COALESCE((filtered_patch->>'service_provider_id')::uuid, service_provider_id),
    sort_order = COALESCE((filtered_patch->>'sort_order')::integer, sort_order),
    copay_allowed = COALESCE((filtered_patch->>'copay_allowed')::boolean, copay_allowed),
    respa_split_limit = COALESCE((filtered_patch->>'respa_split_limit')::integer, respa_split_limit),
    max_split_percentage_non_ssp = COALESCE((filtered_patch->>'max_split_percentage_non_ssp')::integer, max_split_percentage_non_ssp),
    is_respa_regulated = COALESCE((filtered_patch->>'is_respa_regulated')::boolean, is_respa_regulated),
    respa_risk_level = COALESCE((filtered_patch->>'respa_risk_level'), respa_risk_level),
    respa_compliance_notes = COALESCE((filtered_patch->>'respa_compliance_notes'), respa_compliance_notes),
    compliance_checklist = COALESCE(filtered_patch->'compliance_checklist', compliance_checklist),
    regulatory_findings = COALESCE((filtered_patch->>'regulatory_findings'), regulatory_findings),
    supporting_documents = COALESCE(filtered_patch->'supporting_documents', supporting_documents),
    disclaimer_id = COALESCE((filtered_patch->>'disclaimer_id')::uuid, disclaimer_id),
    calendar_link = COALESCE((filtered_patch->>'calendar_link'), calendar_link),
    consultation_email = COALESCE((filtered_patch->>'consultation_email'), consultation_email),
    consultation_phone = COALESCE((filtered_patch->>'consultation_phone'), consultation_phone),
    request_pricing = COALESCE((filtered_patch->>'request_pricing')::boolean, request_pricing),
    pricing_screenshot_url = COALESCE((filtered_patch->>'pricing_screenshot_url'), pricing_screenshot_url),
    pricing_screenshot_captured_at = COALESCE((filtered_patch->>'pricing_screenshot_captured_at')::timestamptz, pricing_screenshot_captured_at),
    pricing_page_url = COALESCE((filtered_patch->>'pricing_page_url'), pricing_page_url),
    is_sponsored = COALESCE((filtered_patch->>'is_sponsored')::boolean, is_sponsored),
    sponsored_rank_boost = COALESCE((filtered_patch->>'sponsored_rank_boost')::integer, sponsored_rank_boost),
    is_published = COALESCE((filtered_patch->>'is_published')::boolean, is_published),
    average_rating = COALESCE((filtered_patch->>'average_rating')::numeric, average_rating),
    booking_type = COALESCE((filtered_patch->>'booking_type'), booking_type),
    external_booking_provider = COALESCE((filtered_patch->>'external_booking_provider'), external_booking_provider),
    external_booking_url = COALESCE((filtered_patch->>'external_booking_url'), external_booking_url),
    booking_time_rules = COALESCE(filtered_patch->'booking_time_rules', booking_time_rules),
    sync_to_ghl = COALESCE((filtered_patch->>'sync_to_ghl')::boolean, sync_to_ghl),
    consultation_emails = COALESCE((filtered_patch->>'consultation_emails')::text[], consultation_emails),
    disclaimer_content = COALESCE(filtered_patch->'disclaimer_content', disclaimer_content),
    allowed_split_percentage = COALESCE((filtered_patch->>'allowed_split_percentage')::integer, allowed_split_percentage),
    title_es = COALESCE((filtered_patch->>'title_es'), title_es),
    title_fr = COALESCE((filtered_patch->>'title_fr'), title_fr),
    description_es = COALESCE((filtered_patch->>'description_es'), description_es),
    description_fr = COALESCE((filtered_patch->>'description_fr'), description_fr),
    ssp_allowed = COALESCE((filtered_patch->>'ssp_allowed')::boolean, ssp_allowed),
    max_split_percentage_ssp = COALESCE((filtered_patch->>'max_split_percentage_ssp')::integer, max_split_percentage_ssp),
    default_package_id = COALESCE((filtered_patch->>'default_package_id'), default_package_id),
    core_version = core_version + 1,
    updated_at = now()
  WHERE services.id = p_id;
  
  -- Return updated record
  RETURN QUERY
  SELECT services.id, services.core_version, services.updated_at
  FROM services WHERE services.id = p_id;
END;
$$;