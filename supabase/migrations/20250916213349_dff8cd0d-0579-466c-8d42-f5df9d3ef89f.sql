-- Fix svc_save_core_patch function to properly handle array fields
DROP FUNCTION IF EXISTS public.svc_save_core_patch(uuid, jsonb, integer);

CREATE OR REPLACE FUNCTION public.svc_save_core_patch(p_id uuid, p_patch jsonb, p_version integer)
RETURNS TABLE(id uuid, version integer, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_core_version integer;
  update_stmt text := 'UPDATE services SET ';
  set_clauses text[] := ARRAY[]::text[];
  final_stmt text;
BEGIN
  -- Get current version
  SELECT s.core_version INTO current_core_version 
  FROM services s WHERE s.id = p_id;
  
  IF current_core_version IS NULL THEN
    RAISE EXCEPTION 'Service not found: %', p_id;
  END IF;
  
  -- Check version conflict
  IF current_core_version != p_version THEN
    RAISE EXCEPTION 'VERSION_CONFLICT: Expected version %, got %', p_version, current_core_version;
  END IF;
  
  -- Build dynamic SET clauses only for fields that exist in patch
  -- Text fields
  IF p_patch ? 'title' THEN set_clauses := array_append(set_clauses, 'title = ' || quote_literal(p_patch->>'title')); END IF;
  IF p_patch ? 'description' THEN set_clauses := array_append(set_clauses, 'description = ' || quote_literal(p_patch->>'description')); END IF;
  IF p_patch ? 'category' THEN set_clauses := array_append(set_clauses, 'category = ' || quote_literal(p_patch->>'category')); END IF;
  IF p_patch ? 'discount_percentage' THEN set_clauses := array_append(set_clauses, 'discount_percentage = ' || quote_literal(p_patch->>'discount_percentage')); END IF;
  IF p_patch ? 'image_url' THEN set_clauses := array_append(set_clauses, 'image_url = ' || quote_literal(p_patch->>'image_url')); END IF;
  IF p_patch ? 'website_url' THEN set_clauses := array_append(set_clauses, 'website_url = ' || quote_literal(p_patch->>'website_url')); END IF;
  IF p_patch ? 'retail_price' THEN set_clauses := array_append(set_clauses, 'retail_price = ' || quote_literal(p_patch->>'retail_price')); END IF;
  IF p_patch ? 'pro_price' THEN set_clauses := array_append(set_clauses, 'pro_price = ' || quote_literal(p_patch->>'pro_price')); END IF;
  IF p_patch ? 'price_duration' THEN set_clauses := array_append(set_clauses, 'price_duration = ' || quote_literal(p_patch->>'price_duration')); END IF;
  IF p_patch ? 'duration' THEN set_clauses := array_append(set_clauses, 'duration = ' || quote_literal(p_patch->>'duration')); END IF;
  IF p_patch ? 'setup_time' THEN set_clauses := array_append(set_clauses, 'setup_time = ' || quote_literal(p_patch->>'setup_time')); END IF;
  
  -- Numeric fields
  IF p_patch ? 'estimated_roi' THEN set_clauses := array_append(set_clauses, 'estimated_roi = ' || (p_patch->>'estimated_roi')::text); END IF;
  IF p_patch ? 'sort_order' THEN set_clauses := array_append(set_clauses, 'sort_order = ' || (p_patch->>'sort_order')::text); END IF;
  IF p_patch ? 'respa_split_limit' THEN set_clauses := array_append(set_clauses, 'respa_split_limit = ' || (p_patch->>'respa_split_limit')::text); END IF;
  IF p_patch ? 'max_split_percentage_non_ssp' THEN set_clauses := array_append(set_clauses, 'max_split_percentage_non_ssp = ' || (p_patch->>'max_split_percentage_non_ssp')::text); END IF;
  IF p_patch ? 'max_split_percentage_ssp' THEN set_clauses := array_append(set_clauses, 'max_split_percentage_ssp = ' || (p_patch->>'max_split_percentage_ssp')::text); END IF;
  IF p_patch ? 'sponsored_rank_boost' THEN set_clauses := array_append(set_clauses, 'sponsored_rank_boost = ' || (p_patch->>'sponsored_rank_boost')::text); END IF;
  IF p_patch ? 'allowed_split_percentage' THEN set_clauses := array_append(set_clauses, 'allowed_split_percentage = ' || (p_patch->>'allowed_split_percentage')::text); END IF;
  IF p_patch ? 'average_rating' THEN set_clauses := array_append(set_clauses, 'average_rating = ' || (p_patch->>'average_rating')::text); END IF;
  
  -- Boolean fields
  IF p_patch ? 'requires_quote' THEN set_clauses := array_append(set_clauses, 'requires_quote = ' || (p_patch->>'requires_quote')::boolean); END IF;
  IF p_patch ? 'is_featured' THEN set_clauses := array_append(set_clauses, 'is_featured = ' || (p_patch->>'is_featured')::boolean); END IF;
  IF p_patch ? 'is_top_pick' THEN set_clauses := array_append(set_clauses, 'is_top_pick = ' || (p_patch->>'is_top_pick')::boolean); END IF;
  IF p_patch ? 'is_verified' THEN set_clauses := array_append(set_clauses, 'is_verified = ' || (p_patch->>'is_verified')::boolean); END IF;
  IF p_patch ? 'is_active' THEN set_clauses := array_append(set_clauses, 'is_active = ' || (p_patch->>'is_active')::boolean); END IF;
  IF p_patch ? 'is_affiliate' THEN set_clauses := array_append(set_clauses, 'is_affiliate = ' || (p_patch->>'is_affiliate')::boolean); END IF;
  IF p_patch ? 'direct_purchase_enabled' THEN set_clauses := array_append(set_clauses, 'direct_purchase_enabled = ' || (p_patch->>'direct_purchase_enabled')::boolean); END IF;
  IF p_patch ? 'copay_allowed' THEN set_clauses := array_append(set_clauses, 'copay_allowed = ' || (p_patch->>'copay_allowed')::boolean); END IF;
  IF p_patch ? 'is_respa_regulated' THEN set_clauses := array_append(set_clauses, 'is_respa_regulated = ' || (p_patch->>'is_respa_regulated')::boolean); END IF;
  IF p_patch ? 'is_sponsored' THEN set_clauses := array_append(set_clauses, 'is_sponsored = ' || (p_patch->>'is_sponsored')::boolean); END IF;
  IF p_patch ? 'is_published' THEN set_clauses := array_append(set_clauses, 'is_published = ' || (p_patch->>'is_published')::boolean); END IF;
  IF p_patch ? 'sync_to_ghl' THEN set_clauses := array_append(set_clauses, 'sync_to_ghl = ' || (p_patch->>'sync_to_ghl')::boolean); END IF;
  IF p_patch ? 'ssp_allowed' THEN set_clauses := array_append(set_clauses, 'ssp_allowed = ' || (p_patch->>'ssp_allowed')::boolean); END IF;
  IF p_patch ? 'request_pricing' THEN set_clauses := array_append(set_clauses, 'request_pricing = ' || (p_patch->>'request_pricing')::boolean); END IF;
  IF p_patch ? 'is_booking_link' THEN set_clauses := array_append(set_clauses, 'is_booking_link = ' || (p_patch->>'is_booking_link')::boolean); END IF;
  
  -- Array fields - properly convert JSONB arrays to PostgreSQL arrays
  IF p_patch ? 'tags' THEN 
    set_clauses := array_append(set_clauses, 'tags = ARRAY(SELECT jsonb_array_elements_text(' || quote_literal(p_patch->'tags'::text) || '::jsonb))'); 
  END IF;
  IF p_patch ? 'consultation_emails' THEN 
    set_clauses := array_append(set_clauses, 'consultation_emails = ARRAY(SELECT jsonb_array_elements_text(' || quote_literal(p_patch->'consultation_emails'::text) || '::jsonb))'); 
  END IF;
  
  -- JSONB fields - direct assignment 
  IF p_patch ? 'compliance_checklist' THEN set_clauses := array_append(set_clauses, 'compliance_checklist = ' || quote_literal(p_patch->'compliance_checklist'::text) || '::jsonb'); END IF;
  IF p_patch ? 'regulatory_findings' THEN set_clauses := array_append(set_clauses, 'regulatory_findings = ' || quote_literal(p_patch->'regulatory_findings'::text) || '::jsonb'); END IF;
  IF p_patch ? 'supporting_documents' THEN set_clauses := array_append(set_clauses, 'supporting_documents = ' || quote_literal(p_patch->'supporting_documents'::text) || '::jsonb'); END IF;
  IF p_patch ? 'booking_time_rules' THEN set_clauses := array_append(set_clauses, 'booking_time_rules = ' || quote_literal(p_patch->'booking_time_rules'::text) || '::jsonb'); END IF;
  IF p_patch ? 'disclaimer_content' THEN set_clauses := array_append(set_clauses, 'disclaimer_content = ' || quote_literal(p_patch->'disclaimer_content'::text) || '::jsonb'); END IF;
  
  -- Text fields that might be null
  IF p_patch ? 'respa_risk_level' THEN set_clauses := array_append(set_clauses, 'respa_risk_level = ' || COALESCE(quote_literal(p_patch->>'respa_risk_level'), 'NULL')); END IF;
  IF p_patch ? 'respa_compliance_notes' THEN set_clauses := array_append(set_clauses, 'respa_compliance_notes = ' || COALESCE(quote_literal(p_patch->>'respa_compliance_notes'), 'NULL')); END IF;
  IF p_patch ? 'co_pay_price' THEN set_clauses := array_append(set_clauses, 'co_pay_price = ' || COALESCE(quote_literal(p_patch->>'co_pay_price'), 'NULL')); END IF;
  IF p_patch ? 'calendar_link' THEN set_clauses := array_append(set_clauses, 'calendar_link = ' || COALESCE(quote_literal(p_patch->>'calendar_link'), 'NULL')); END IF;
  IF p_patch ? 'consultation_email' THEN set_clauses := array_append(set_clauses, 'consultation_email = ' || COALESCE(quote_literal(p_patch->>'consultation_email'), 'NULL')); END IF;
  IF p_patch ? 'consultation_phone' THEN set_clauses := array_append(set_clauses, 'consultation_phone = ' || COALESCE(quote_literal(p_patch->>'consultation_phone'), 'NULL')); END IF;
  IF p_patch ? 'booking_type' THEN set_clauses := array_append(set_clauses, 'booking_type = ' || COALESCE(quote_literal(p_patch->>'booking_type'), 'NULL')); END IF;
  IF p_patch ? 'external_booking_provider' THEN set_clauses := array_append(set_clauses, 'external_booking_provider = ' || COALESCE(quote_literal(p_patch->>'external_booking_provider'), 'NULL')); END IF;
  IF p_patch ? 'external_booking_url' THEN set_clauses := array_append(set_clauses, 'external_booking_url = ' || COALESCE(quote_literal(p_patch->>'external_booking_url'), 'NULL')); END IF;
  IF p_patch ? 'pricing_mode' THEN set_clauses := array_append(set_clauses, 'pricing_mode = ' || COALESCE(quote_literal(p_patch->>'pricing_mode'), 'NULL')); END IF;
  IF p_patch ? 'pricing_external_url' THEN set_clauses := array_append(set_clauses, 'pricing_external_url = ' || COALESCE(quote_literal(p_patch->>'pricing_external_url'), 'NULL')); END IF;
  IF p_patch ? 'pricing_cta_label' THEN set_clauses := array_append(set_clauses, 'pricing_cta_label = ' || COALESCE(quote_literal(p_patch->>'pricing_cta_label'), 'NULL')); END IF;
  IF p_patch ? 'pricing_cta_type' THEN set_clauses := array_append(set_clauses, 'pricing_cta_type = ' || COALESCE(quote_literal(p_patch->>'pricing_cta_type'), 'NULL')); END IF;
  IF p_patch ? 'pricing_note' THEN set_clauses := array_append(set_clauses, 'pricing_note = ' || COALESCE(quote_literal(p_patch->>'pricing_note'), 'NULL')); END IF;
  
  -- Always update version and timestamp
  set_clauses := array_append(set_clauses, 'core_version = core_version + 1');
  set_clauses := array_append(set_clauses, 'updated_at = now()');
  
  -- Skip if no changes (only version update)
  IF array_length(set_clauses, 1) <= 2 THEN
    RETURN QUERY
    SELECT s.id, s.core_version, s.updated_at
    FROM services s WHERE s.id = p_id;
    RETURN;
  END IF;
  
  -- Execute dynamic update
  final_stmt := update_stmt || array_to_string(set_clauses, ', ') || ' WHERE id = ' || quote_literal(p_id);
  EXECUTE final_stmt;
  
  -- Return updated service info
  RETURN QUERY
  SELECT s.id, s.core_version, s.updated_at
  FROM services s WHERE s.id = p_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to save core patch: %', SQLERRM;
END;
$function$;