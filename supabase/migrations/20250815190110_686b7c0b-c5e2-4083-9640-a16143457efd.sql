-- Add seeding columns to vendors table
ALTER TABLE public.vendors 
ADD COLUMN seeded_co_marketing_agents integer DEFAULT 0,
ADD COLUMN seed_active boolean DEFAULT false,
ADD COLUMN seed_expires_at timestamp with time zone,
ADD COLUMN seed_notes text,
ADD COLUMN computed_co_marketing_agents integer DEFAULT 0;

-- Update the calculate_vendor_stats function to store computed value separately
CREATE OR REPLACE FUNCTION public.calculate_vendor_stats(vendor_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  active_agents integer := 0;
  total_campaigns integer := 0;
  active_allocations integer := 0;
  result jsonb;
BEGIN
  -- Count unique agents with active co-pay requests
  SELECT COUNT(DISTINCT agent_id) INTO active_agents
  FROM co_pay_requests 
  WHERE vendor_id = vendor_uuid 
    AND status IN ('approved', 'active', 'pending');
  
  -- Count total campaigns (co-pay requests)
  SELECT COUNT(*) INTO total_campaigns
  FROM co_pay_requests 
  WHERE vendor_id = vendor_uuid;
  
  -- Count active point allocations
  SELECT COUNT(DISTINCT agent_id) INTO active_allocations
  FROM point_allocations 
  WHERE vendor_id = vendor_uuid 
    AND status = 'active'
    AND (start_date IS NULL OR start_date <= CURRENT_DATE)
    AND (end_date IS NULL OR end_date >= CURRENT_DATE);
  
  -- Use the highest count as computed value
  active_agents := GREATEST(active_agents, active_allocations);
  
  result := jsonb_build_object(
    'computed_co_marketing_agents', active_agents,
    'campaigns_funded', total_campaigns,
    'last_calculated', now()
  );
  
  RETURN result;
END;
$function$;

-- Update vendor stats trigger to handle seeding logic
CREATE OR REPLACE FUNCTION public.update_vendor_stats_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  stats jsonb;
  computed_count integer;
  effective_count integer;
BEGIN
  -- Update stats for the affected vendor
  IF TG_OP = 'DELETE' THEN
    stats := calculate_vendor_stats(OLD.vendor_id);
    computed_count := (stats->>'computed_co_marketing_agents')::integer;
    
    -- Calculate effective count based on seeding logic
    SELECT CASE 
      WHEN seed_active = true 
           AND (seed_expires_at IS NULL OR seed_expires_at > now()) 
           AND computed_count = 0 
      THEN COALESCE(seeded_co_marketing_agents, 0)
      ELSE computed_count 
    END INTO effective_count
    FROM vendors WHERE id = OLD.vendor_id;
    
    UPDATE vendors 
    SET 
      computed_co_marketing_agents = computed_count,
      co_marketing_agents = effective_count,
      campaigns_funded = (stats->>'campaigns_funded')::integer,
      updated_at = now()
    WHERE id = OLD.vendor_id;
    RETURN OLD;
  ELSE
    stats := calculate_vendor_stats(NEW.vendor_id);
    computed_count := (stats->>'computed_co_marketing_agents')::integer;
    
    -- Calculate effective count based on seeding logic
    SELECT CASE 
      WHEN seed_active = true 
           AND (seed_expires_at IS NULL OR seed_expires_at > now()) 
           AND computed_count = 0 
      THEN COALESCE(seeded_co_marketing_agents, 0)
      ELSE computed_count 
    END INTO effective_count
    FROM vendors WHERE id = NEW.vendor_id;
    
    UPDATE vendors 
    SET 
      computed_co_marketing_agents = computed_count,
      co_marketing_agents = effective_count,
      campaigns_funded = (stats->>'campaigns_funded')::integer,
      updated_at = now()
    WHERE id = NEW.vendor_id;
    RETURN NEW;
  END IF;
END;
$function$;

-- Update all vendor stats function to handle seeding
CREATE OR REPLACE FUNCTION public.update_all_vendor_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  vendor_record RECORD;
  stats jsonb;
  computed_count integer;
  effective_count integer;
BEGIN
  FOR vendor_record IN SELECT id FROM vendors WHERE is_active = true
  LOOP
    stats := calculate_vendor_stats(vendor_record.id);
    computed_count := (stats->>'computed_co_marketing_agents')::integer;
    
    -- Calculate effective count based on seeding logic
    SELECT CASE 
      WHEN seed_active = true 
           AND (seed_expires_at IS NULL OR seed_expires_at > now()) 
           AND computed_count = 0 
      THEN COALESCE(seeded_co_marketing_agents, 0)
      ELSE computed_count 
    END INTO effective_count
    FROM vendors WHERE id = vendor_record.id;
    
    UPDATE vendors 
    SET 
      computed_co_marketing_agents = computed_count,
      co_marketing_agents = effective_count,
      campaigns_funded = (stats->>'campaigns_funded')::integer,
      updated_at = now()
    WHERE id = vendor_record.id;
  END LOOP;
END;
$function$;

-- Backfill existing data: copy current co_marketing_agents to seeded where computed would be 0
UPDATE vendors 
SET 
  computed_co_marketing_agents = 0,
  seeded_co_marketing_agents = co_marketing_agents,
  seed_active = CASE WHEN co_marketing_agents > 0 THEN true ELSE false END,
  seed_notes = 'Initial seed from existing data'
WHERE co_marketing_agents > 0;