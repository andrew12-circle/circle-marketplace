-- Continue fixing remaining security issues

-- First, let's identify any views that might be problematic
-- Drop any potentially problematic views and recreate them properly
DROP VIEW IF EXISTS public.security_definer_view CASCADE;

-- Fix remaining functions with missing search_path based on the schema
-- These are the remaining functions that likely need fixing:

CREATE OR REPLACE FUNCTION public.update_vendor_stats_from_allocations()
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

CREATE OR REPLACE FUNCTION public.update_vendor_stats_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.log_compliance_workflow_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.compliance_workflow_log (
    co_pay_request_id,
    action_type,
    performed_by,
    previous_status,
    new_status,
    notes
  ) VALUES (
    NEW.id,
    CASE 
      WHEN OLD.compliance_status IS DISTINCT FROM NEW.compliance_status THEN 'status_change'
      WHEN OLD.compliance_notes IS DISTINCT FROM NEW.compliance_notes THEN 'notes_updated'
      ELSE 'updated'
    END,
    auth.uid(),
    OLD.compliance_status,
    NEW.compliance_status,
    CASE 
      WHEN OLD.compliance_notes IS DISTINCT FROM NEW.compliance_notes THEN NEW.compliance_notes
      ELSE NULL
    END
  );
  
  RETURN NEW;
END;
$$;