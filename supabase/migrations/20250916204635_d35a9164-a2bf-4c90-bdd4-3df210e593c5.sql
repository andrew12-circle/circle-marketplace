-- Add version columns for conflict detection
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS core_version INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS funnel_version INTEGER NOT NULL DEFAULT 1;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);

-- RPC for saving core service fields (title, description, prices, toggles)
CREATE OR REPLACE FUNCTION svc_save_core_patch(p_id uuid, p_patch jsonb, p_version int)
RETURNS TABLE(id uuid, core_version int, updated_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE 
  v int;
BEGIN
  -- Get current version with row lock
  SELECT services.core_version INTO v FROM services WHERE services.id = p_id FOR UPDATE;
  
  IF v IS NULL THEN 
    RAISE EXCEPTION 'NOT_FOUND'; 
  END IF;
  
  IF v <> p_version THEN 
    RAISE EXCEPTION 'VERSION_CONFLICT'; 
  END IF;

  -- Update only core fields
  UPDATE services
  SET
    title = COALESCE(p_patch->>'title', title),
    short_desc = COALESCE(p_patch->>'short_desc', short_desc),
    description = COALESCE(p_patch->>'description', description),
    retail_price = COALESCE((p_patch->>'retail_price')::numeric, retail_price),
    pro_price = COALESCE((p_patch->>'pro_price')::numeric, pro_price),
    co_pay_price = COALESCE((p_patch->>'co_pay_price')::numeric, co_pay_price),
    pricing_mode = COALESCE(p_patch->>'pricing_mode', pricing_mode),
    pricing_external_url = COALESCE(p_patch->>'pricing_external_url', pricing_external_url),
    pricing_cta_label = COALESCE(p_patch->>'pricing_cta_label', pricing_cta_label),
    pricing_cta_type = COALESCE(p_patch->>'pricing_cta_type', pricing_cta_type),
    pricing_note = COALESCE(p_patch->>'pricing_note', pricing_note),
    tags = COALESCE(p_patch->'tags', tags),
    category = COALESCE(p_patch->>'category', category),
    is_featured = COALESCE((p_patch->>'is_featured')::boolean, is_featured),
    is_top_pick = COALESCE((p_patch->>'is_top_pick')::boolean, is_top_pick),
    is_active = COALESCE((p_patch->>'is_active')::boolean, is_active),
    updated_at = now(),
    core_version = core_version + 1
  WHERE services.id = p_id
  RETURNING services.id, services.core_version, services.updated_at;
  
  RETURN NEXT;
END $$;

-- RPC for saving funnel content only
CREATE OR REPLACE FUNCTION svc_save_funnel_patch(p_id uuid, p_patch jsonb, p_version int)
RETURNS TABLE(id uuid, funnel_version int, updated_at timestamptz)
LANGUAGE plpgsql  
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE 
  v int;
BEGIN
  -- Get current version with row lock
  SELECT services.funnel_version INTO v FROM services WHERE services.id = p_id FOR UPDATE;
  
  IF v IS NULL THEN 
    RAISE EXCEPTION 'NOT_FOUND'; 
  END IF;
  
  IF v <> p_version THEN 
    RAISE EXCEPTION 'VERSION_CONFLICT'; 
  END IF;

  -- Update only funnel fields
  UPDATE services
  SET
    funnel_content = COALESCE(p_patch->'funnel_content', funnel_content),
    pricing_tiers = COALESCE(p_patch->'pricing_tiers', pricing_tiers),
    updated_at = now(),
    funnel_version = funnel_version + 1
  WHERE services.id = p_id
  RETURNING services.id, services.funnel_version, services.updated_at;
  
  RETURN NEXT;
END $$;