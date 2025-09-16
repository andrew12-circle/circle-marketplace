-- Fix svc_save_funnel_patch function to avoid COALESCE type mismatches
DROP FUNCTION IF EXISTS public.svc_save_funnel_patch(uuid, jsonb, integer);

CREATE OR REPLACE FUNCTION public.svc_save_funnel_patch(p_id uuid, p_patch jsonb, p_version integer)
RETURNS TABLE(id uuid, version integer, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_funnel_version integer;
  update_stmt text := 'UPDATE services SET ';
  set_clauses text[] := ARRAY[]::text[];
  final_stmt text;
BEGIN
  -- Get current version
  SELECT s.funnel_version INTO current_funnel_version 
  FROM services s WHERE s.id = p_id;
  
  IF current_funnel_version IS NULL THEN
    RAISE EXCEPTION 'Service not found: %', p_id;
  END IF;
  
  -- Check version conflict
  IF current_funnel_version != p_version THEN
    RAISE EXCEPTION 'VERSION_CONFLICT: Expected version %, got %', p_version, current_funnel_version;
  END IF;
  
  -- Build dynamic SET clauses only for fields that exist in patch
  -- JSONB fields
  IF p_patch ? 'funnel_content' THEN 
    set_clauses := array_append(set_clauses, 'funnel_content = ' || quote_literal(p_patch->'funnel_content'::text) || '::jsonb'); 
  END IF;
  IF p_patch ? 'pricing_tiers' THEN 
    set_clauses := array_append(set_clauses, 'pricing_tiers = ' || quote_literal(p_patch->'pricing_tiers'::text) || '::jsonb'); 
  END IF;
  
  -- Text fields that might be null
  IF p_patch ? 'pricing_mode' THEN 
    set_clauses := array_append(set_clauses, 'pricing_mode = ' || COALESCE(quote_literal(p_patch->>'pricing_mode'), 'NULL')); 
  END IF;
  IF p_patch ? 'pricing_external_url' THEN 
    set_clauses := array_append(set_clauses, 'pricing_external_url = ' || COALESCE(quote_literal(p_patch->>'pricing_external_url'), 'NULL')); 
  END IF;
  IF p_patch ? 'pricing_cta_label' THEN 
    set_clauses := array_append(set_clauses, 'pricing_cta_label = ' || COALESCE(quote_literal(p_patch->>'pricing_cta_label'), 'NULL')); 
  END IF;
  IF p_patch ? 'pricing_cta_type' THEN 
    set_clauses := array_append(set_clauses, 'pricing_cta_type = ' || COALESCE(quote_literal(p_patch->>'pricing_cta_type'), 'NULL')); 
  END IF;
  IF p_patch ? 'pricing_note' THEN 
    set_clauses := array_append(set_clauses, 'pricing_note = ' || COALESCE(quote_literal(p_patch->>'pricing_note'), 'NULL')); 
  END IF;
  
  -- Always update version and timestamp
  set_clauses := array_append(set_clauses, 'funnel_version = funnel_version + 1');
  set_clauses := array_append(set_clauses, 'updated_at = now()');
  
  -- Skip if no changes (only version update)
  IF array_length(set_clauses, 1) <= 2 THEN
    RETURN QUERY
    SELECT s.id, s.funnel_version, s.updated_at
    FROM services s WHERE s.id = p_id;
    RETURN;
  END IF;
  
  -- Execute dynamic update
  final_stmt := update_stmt || array_to_string(set_clauses, ', ') || ' WHERE id = ' || quote_literal(p_id);
  EXECUTE final_stmt;
  
  -- Return updated service info
  RETURN QUERY
  SELECT s.id, s.funnel_version, s.updated_at
  FROM services s WHERE s.id = p_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to save funnel patch: %', SQLERRM;
END;
$function$;