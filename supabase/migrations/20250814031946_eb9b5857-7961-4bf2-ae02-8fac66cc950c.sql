-- Create a function to calculate real-time vendor statistics
CREATE OR REPLACE FUNCTION calculate_vendor_stats(vendor_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  
  -- Use the highest count as co_marketing_agents
  active_agents := GREATEST(active_agents, active_allocations);
  
  result := jsonb_build_object(
    'co_marketing_agents', active_agents,
    'campaigns_funded', total_campaigns,
    'last_calculated', now()
  );
  
  RETURN result;
END;
$$;

-- Create a view for vendors with calculated stats
CREATE OR REPLACE VIEW vendors_with_live_stats AS
SELECT 
  v.*,
  COALESCE((calculate_vendor_stats(v.id))->>'co_marketing_agents', '0')::integer as live_co_marketing_agents,
  COALESCE((calculate_vendor_stats(v.id))->>'campaigns_funded', '0')::integer as live_campaigns_funded
FROM vendors v;

-- Create a function to update vendor stats periodically
CREATE OR REPLACE FUNCTION update_all_vendor_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  vendor_record RECORD;
  stats jsonb;
BEGIN
  FOR vendor_record IN SELECT id FROM vendors WHERE is_active = true
  LOOP
    stats := calculate_vendor_stats(vendor_record.id);
    
    UPDATE vendors 
    SET 
      co_marketing_agents = (stats->>'co_marketing_agents')::integer,
      campaigns_funded = (stats->>'campaigns_funded')::integer,
      updated_at = now()
    WHERE id = vendor_record.id;
  END LOOP;
END;
$$;

-- Create a trigger to update vendor stats when co_pay_requests change
CREATE OR REPLACE FUNCTION update_vendor_stats_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stats jsonb;
BEGIN
  -- Update stats for the affected vendor
  IF TG_OP = 'DELETE' THEN
    stats := calculate_vendor_stats(OLD.vendor_id);
    UPDATE vendors 
    SET 
      co_marketing_agents = (stats->>'co_marketing_agents')::integer,
      campaigns_funded = (stats->>'campaigns_funded')::integer,
      updated_at = now()
    WHERE id = OLD.vendor_id;
    RETURN OLD;
  ELSE
    stats := calculate_vendor_stats(NEW.vendor_id);
    UPDATE vendors 
    SET 
      co_marketing_agents = (stats->>'co_marketing_agents')::integer,
      campaigns_funded = (stats->>'campaigns_funded')::integer,
      updated_at = now()
    WHERE id = NEW.vendor_id;
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS update_vendor_stats_on_copay_change ON co_pay_requests;
CREATE TRIGGER update_vendor_stats_on_copay_change
  AFTER INSERT OR UPDATE OR DELETE ON co_pay_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_stats_trigger();

-- Create trigger for point allocations
CREATE OR REPLACE FUNCTION update_vendor_stats_from_allocations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  stats jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    stats := calculate_vendor_stats(OLD.vendor_id);
    UPDATE vendors 
    SET co_marketing_agents = (stats->>'co_marketing_agents')::integer
    WHERE id = OLD.vendor_id;
    RETURN OLD;
  ELSE
    stats := calculate_vendor_stats(NEW.vendor_id);
    UPDATE vendors 
    SET co_marketing_agents = (stats->>'co_marketing_agents')::integer
    WHERE id = NEW.vendor_id;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS update_vendor_stats_on_allocation_change ON point_allocations;
CREATE TRIGGER update_vendor_stats_on_allocation_change
  AFTER INSERT OR UPDATE OR DELETE ON point_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_stats_from_allocations();

-- Initialize with current data
SELECT update_all_vendor_stats();