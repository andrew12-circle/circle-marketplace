-- Drop the existing function and recreate with proper column references
DROP FUNCTION IF EXISTS svc_save_core_patch(uuid, jsonb, integer);

CREATE OR REPLACE FUNCTION svc_save_core_patch(
  p_id uuid,
  p_patch jsonb,
  p_version integer
) RETURNS TABLE(id uuid, version integer, updated_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_core_version integer;
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
  -- Get current version with explicit table reference
  SELECT s.core_version INTO current_core_version 
  FROM services s WHERE s.id = p_id;
  
  IF current_core_version IS NULL THEN
    RAISE EXCEPTION 'Service not found: %', p_id;
  END IF;
  
  -- Check version conflict
  IF current_core_version != p_version THEN
    RAISE EXCEPTION 'VERSION_CONFLICT: Expected version %, got %', p_version, current_core_version;
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
    SELECT s.id, s.core_version, s.updated_at
    FROM services s WHERE s.id = p_id;
    RETURN;
  END IF;
  
  -- Dynamic update using filtered patch with explicit table reference
  UPDATE services s
  SET 
    title = COALESCE((filtered_patch->>'title'), s.title),
    description = COALESCE((filtered_patch->>'description'), s.description),
    category = COALESCE((filtered_patch->>'category'), s.category),
    discount_percentage = COALESCE((filtered_patch->>'discount_percentage'), s.discount_percentage),
    image_url = COALESCE((filtered_patch->>'image_url'), s.image_url),
    profile_image_url = COALESCE((filtered_patch->>'profile_image_url'), s.profile_image_url),
    website_url = COALESCE((filtered_patch->>'website_url'), s.website_url),
    retail_price = COALESCE((filtered_patch->>'retail_price'), s.retail_price),
    pro_price = COALESCE((filtered_patch->>'pro_price'), s.pro_price),
    co_pay_price = COALESCE((filtered_patch->>'co_pay_price'), s.co_pay_price),
    price_duration = COALESCE((filtered_patch->>'price_duration'), s.price_duration),
    estimated_roi = COALESCE((filtered_patch->>'estimated_roi')::numeric, s.estimated_roi),
    duration = COALESCE((filtered_patch->>'duration'), s.duration),
    setup_time = COALESCE((filtered_patch->>'setup_time'), s.setup_time),
    tags = COALESCE((filtered_patch->>'tags')::text[], s.tags),
    rating = COALESCE((filtered_patch->>'rating')::numeric, s.rating),
    requires_quote = COALESCE((filtered_patch->>'requires_quote')::boolean, s.requires_quote),
    is_featured = COALESCE((filtered_patch->>'is_featured')::boolean, s.is_featured),
    is_top_pick = COALESCE((filtered_patch->>'is_top_pick')::boolean, s.is_top_pick),
    is_verified = COALESCE((filtered_patch->>'is_verified')::boolean, s.is_verified),
    is_active = COALESCE((filtered_patch->>'is_active')::boolean, s.is_active),
    is_affiliate = COALESCE((filtered_patch->>'is_affiliate')::boolean, s.is_affiliate),
    is_booking_link = COALESCE((filtered_patch->>'is_booking_link')::boolean, s.is_booking_link),
    direct_purchase_enabled = COALESCE((filtered_patch->>'direct_purchase_enabled')::boolean, s.direct_purchase_enabled),
    service_provider_id = COALESCE((filtered_patch->>'service_provider_id')::uuid, s.service_provider_id),
    sort_order = COALESCE((filtered_patch->>'sort_order')::integer, s.sort_order),
    copay_allowed = COALESCE((filtered_patch->>'copay_allowed')::boolean, s.copay_allowed),
    respa_split_limit = COALESCE((filtered_patch->>'respa_split_limit')::integer, s.respa_split_limit),
    max_split_percentage_non_ssp = COALESCE((filtered_patch->>'max_split_percentage_non_ssp')::integer, s.max_split_percentage_non_ssp),
    is_respa_regulated = COALESCE((filtered_patch->>'is_respa_regulated')::boolean, s.is_respa_regulated),
    respa_risk_level = COALESCE((filtered_patch->>'respa_risk_level'), s.respa_risk_level),
    respa_compliance_notes = COALESCE((filtered_patch->>'respa_compliance_notes'), s.respa_compliance_notes),
    compliance_checklist = COALESCE((filtered_patch->>'compliance_checklist')::jsonb, s.compliance_checklist),
    regulatory_findings = COALESCE((filtered_patch->>'regulatory_findings')::jsonb, s.regulatory_findings),
    supporting_documents = COALESCE((filtered_patch->>'supporting_documents')::jsonb, s.supporting_documents),
    disclaimer_id = COALESCE((filtered_patch->>'disclaimer_id')::uuid, s.disclaimer_id),
    calendar_link = COALESCE((filtered_patch->>'calendar_link'), s.calendar_link),
    consultation_email = COALESCE((filtered_patch->>'consultation_email'), s.consultation_email),
    consultation_phone = COALESCE((filtered_patch->>'consultation_phone'), s.consultation_phone),
    request_pricing = COALESCE((filtered_patch->>'request_pricing')::boolean, s.request_pricing),
    pricing_screenshot_url = COALESCE((filtered_patch->>'pricing_screenshot_url'), s.pricing_screenshot_url),
    pricing_screenshot_captured_at = COALESCE((filtered_patch->>'pricing_screenshot_captured_at')::timestamptz, s.pricing_screenshot_captured_at),
    pricing_page_url = COALESCE((filtered_patch->>'pricing_page_url'), s.pricing_page_url),
    is_sponsored = COALESCE((filtered_patch->>'is_sponsored')::boolean, s.is_sponsored),
    sponsored_rank_boost = COALESCE((filtered_patch->>'sponsored_rank_boost')::integer, s.sponsored_rank_boost),
    is_published = COALESCE((filtered_patch->>'is_published')::boolean, s.is_published),
    average_rating = COALESCE((filtered_patch->>'average_rating')::numeric, s.average_rating),
    booking_type = COALESCE((filtered_patch->>'booking_type'), s.booking_type),
    external_booking_provider = COALESCE((filtered_patch->>'external_booking_provider'), s.external_booking_provider),
    external_booking_url = COALESCE((filtered_patch->>'external_booking_url'), s.external_booking_url),
    booking_time_rules = COALESCE((filtered_patch->>'booking_time_rules')::jsonb, s.booking_time_rules),
    sync_to_ghl = COALESCE((filtered_patch->>'sync_to_ghl')::boolean, s.sync_to_ghl),
    consultation_emails = COALESCE((filtered_patch->>'consultation_emails')::text[], s.consultation_emails),
    disclaimer_content = COALESCE((filtered_patch->>'disclaimer_content'), s.disclaimer_content),
    allowed_split_percentage = COALESCE((filtered_patch->>'allowed_split_percentage')::integer, s.allowed_split_percentage),
    title_es = COALESCE((filtered_patch->>'title_es'), s.title_es),
    title_fr = COALESCE((filtered_patch->>'title_fr'), s.title_fr),
    description_es = COALESCE((filtered_patch->>'description_es'), s.description_es),
    description_fr = COALESCE((filtered_patch->>'description_fr'), s.description_fr),
    ssp_allowed = COALESCE((filtered_patch->>'ssp_allowed')::boolean, s.ssp_allowed),
    max_split_percentage_ssp = COALESCE((filtered_patch->>'max_split_percentage_ssp')::integer, s.max_split_percentage_ssp),
    default_package_id = COALESCE((filtered_patch->>'default_package_id')::uuid, s.default_package_id),
    -- Always update core_version and updated_at
    core_version = s.core_version + 1,
    updated_at = now()
  WHERE s.id = p_id;
  
  -- Return updated service info with explicit table reference
  RETURN QUERY
  SELECT s.id, s.core_version, s.updated_at
  FROM services s WHERE s.id = p_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to save core patch: %', SQLERRM;
END;
$$;