-- Fix the RPC functions to only update existing columns
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
  valid_columns text[] := ARRAY[
    'title', 'description', 'category', 'image_url', 'profile_image_url', 
    'website_url', 'retail_price', 'pro_price', 'co_pay_price', 'price_duration',
    'estimated_roi', 'duration', 'setup_time', 'tags', 'rating', 'requires_quote',
    'is_featured', 'is_top_pick', 'is_verified', 'is_active', 'is_affiliate',
    'is_booking_link', 'direct_purchase_enabled', 'vendor_id', 'service_provider_id',
    'sort_order', 'copay_allowed', 'respa_split_limit', 'max_split_percentage_non_ssp',
    'is_respa_regulated', 'respa_risk_level', 'respa_compliance_notes',
    'compliance_checklist', 'regulatory_findings', 'supporting_documents',
    'disclaimer_id', 'calendar_link', 'consultation_email', 'consultation_phone',
    'request_pricing', 'pricing_screenshot_url', 'pricing_screenshot_captured_at',
    'pricing_page_url'
  ];
BEGIN
  -- Get current version
  SELECT services.core_version INTO current_version 
  FROM services WHERE services.id = p_id;
  
  -- Check version conflict
  IF current_version != p_version THEN
    RAISE EXCEPTION 'VERSION_CONFLICT: Expected version %, got %', p_version, current_version;
  END IF;
  
  -- Filter patch to only include valid columns
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
  
  -- Update with filtered patch and increment version
  UPDATE services 
  SET 
    title = COALESCE((filtered_patch->>'title')::text, title),
    description = COALESCE((filtered_patch->>'description')::text, description),
    category = COALESCE((filtered_patch->>'category')::text, category),
    image_url = COALESCE((filtered_patch->>'image_url')::text, image_url),
    profile_image_url = COALESCE((filtered_patch->>'profile_image_url')::text, profile_image_url),
    website_url = COALESCE((filtered_patch->>'website_url')::text, website_url),
    retail_price = COALESCE((filtered_patch->>'retail_price')::text, retail_price),
    pro_price = COALESCE((filtered_patch->>'pro_price')::text, pro_price),
    co_pay_price = COALESCE((filtered_patch->>'co_pay_price')::text, co_pay_price),
    price_duration = COALESCE((filtered_patch->>'price_duration')::text, price_duration),
    estimated_roi = COALESCE((filtered_patch->>'estimated_roi')::integer, estimated_roi),
    duration = COALESCE((filtered_patch->>'duration')::text, duration),
    setup_time = COALESCE((filtered_patch->>'setup_time')::text, setup_time),
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
    vendor_id = COALESCE((filtered_patch->>'vendor_id')::uuid, vendor_id),
    service_provider_id = COALESCE((filtered_patch->>'service_provider_id')::uuid, service_provider_id),
    sort_order = COALESCE((filtered_patch->>'sort_order')::integer, sort_order),
    copay_allowed = COALESCE((filtered_patch->>'copay_allowed')::boolean, copay_allowed),
    respa_split_limit = COALESCE((filtered_patch->>'respa_split_limit')::integer, respa_split_limit),
    max_split_percentage_non_ssp = COALESCE((filtered_patch->>'max_split_percentage_non_ssp')::integer, max_split_percentage_non_ssp),
    core_version = core_version + 1,
    updated_at = now()
  WHERE services.id = p_id;
  
  -- Return updated record
  RETURN QUERY
  SELECT services.id, services.core_version, services.updated_at
  FROM services WHERE services.id = p_id;
END;
$$;

-- Also fix the funnel patch function
CREATE OR REPLACE FUNCTION public.svc_save_funnel_patch(
  p_id uuid,
  p_patch jsonb,
  p_version integer DEFAULT 1
) RETURNS TABLE(id uuid, funnel_version integer, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_version integer;
  filtered_patch jsonb := '{}';
  key text;
  valid_columns text[] := ARRAY['funnel_content', 'pricing_tiers', 'pricing_mode', 'pricing_external_url', 'pricing_cta_label', 'pricing_cta_type', 'pricing_note'];
BEGIN
  -- Get current version
  SELECT services.funnel_version INTO current_version 
  FROM services WHERE services.id = p_id;
  
  -- Check version conflict
  IF current_version != p_version THEN
    RAISE EXCEPTION 'VERSION_CONFLICT: Expected version %, got %', p_version, current_version;
  END IF;
  
  -- Filter patch to only include valid columns
  FOR key IN SELECT jsonb_object_keys(p_patch) LOOP
    IF key = ANY(valid_columns) THEN
      filtered_patch := filtered_patch || jsonb_build_object(key, p_patch->key);
    END IF;
  END LOOP;
  
  -- Skip if no valid changes
  IF filtered_patch = '{}' THEN
    RETURN QUERY
    SELECT services.id, services.funnel_version, services.updated_at
    FROM services WHERE services.id = p_id;
    RETURN;
  END IF;
  
  -- Update with filtered patch and increment version
  UPDATE services 
  SET 
    funnel_content = COALESCE(filtered_patch->'funnel_content', funnel_content),
    pricing_tiers = COALESCE(filtered_patch->'pricing_tiers', pricing_tiers),
    pricing_mode = COALESCE((filtered_patch->>'pricing_mode')::text, pricing_mode),
    pricing_external_url = COALESCE((filtered_patch->>'pricing_external_url')::text, pricing_external_url),
    pricing_cta_label = COALESCE((filtered_patch->>'pricing_cta_label')::text, pricing_cta_label),
    pricing_cta_type = COALESCE((filtered_patch->>'pricing_cta_type')::text, pricing_cta_type),
    pricing_note = COALESCE((filtered_patch->>'pricing_note')::text, pricing_note),
    funnel_version = funnel_version + 1,
    updated_at = now()
  WHERE services.id = p_id;
  
  -- Return updated record
  RETURN QUERY
  SELECT services.id, services.funnel_version, services.updated_at
  FROM services WHERE services.id = p_id;
END;
$$;