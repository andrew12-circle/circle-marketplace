-- Create vendor agent criteria table for filtering
CREATE TABLE public.vendor_agent_criteria (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Volume criteria
  min_annual_volume numeric,
  max_annual_volume numeric,
  
  -- Experience criteria  
  min_years_experience integer,
  max_years_experience integer,
  
  -- Transaction criteria
  min_transactions_closed integer,
  min_conversion_rate numeric,
  
  -- Geographic criteria
  target_states text[],
  target_markets text[],
  
  -- Agent tier requirements
  allowed_agent_tiers text[] DEFAULT '{"all"}',
  
  -- Other criteria
  min_average_commission numeric,
  requires_nmls boolean DEFAULT false,
  
  -- Status and metadata
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(vendor_id)
);

-- Enable RLS
ALTER TABLE public.vendor_agent_criteria ENABLE ROW LEVEL SECURITY;

-- Create policies (simplified for now)
CREATE POLICY "Admins can manage all criteria" 
ON public.vendor_agent_criteria 
FOR ALL 
TO authenticated 
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

CREATE POLICY "Criteria viewable by authenticated users" 
ON public.vendor_agent_criteria 
FOR SELECT 
TO authenticated 
USING (is_active = true);

-- Create function to check if agent matches vendor criteria
CREATE OR REPLACE FUNCTION check_agent_vendor_match(
  p_agent_id uuid, 
  p_vendor_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  agent_data RECORD;
  criteria RECORD;
  agent_performance RECORD;
BEGIN
  -- Get agent basic data
  SELECT * INTO agent_data
  FROM agents
  WHERE user_id = p_agent_id AND is_active = true;
  
  -- If no agent profile found, allow by default
  IF agent_data.id IS NULL THEN
    RETURN true;
  END IF;
  
  -- Get vendor criteria
  SELECT * INTO criteria
  FROM vendor_agent_criteria
  WHERE vendor_id = p_vendor_id AND is_active = true;
  
  -- If vendor has no criteria set, allow all agents
  IF criteria.id IS NULL THEN
    RETURN true;
  END IF;
  
  -- Get agent performance data (latest month)
  SELECT * INTO agent_performance
  FROM agent_performance_tracking
  WHERE agent_id = agent_data.id
  ORDER BY month_year DESC
  LIMIT 1;
  
  -- Check years of experience
  IF criteria.min_years_experience IS NOT NULL AND 
     COALESCE(agent_data.years_active, 0) < criteria.min_years_experience THEN
    RETURN false;
  END IF;
  
  IF criteria.max_years_experience IS NOT NULL AND 
     COALESCE(agent_data.years_active, 0) > criteria.max_years_experience THEN
    RETURN false;
  END IF;
  
  -- Check performance criteria if we have performance data
  IF agent_performance.id IS NOT NULL THEN
    -- Check annual volume
    IF criteria.min_annual_volume IS NOT NULL AND 
       COALESCE(agent_performance.volume_closed, 0) < criteria.min_annual_volume THEN
      RETURN false;
    END IF;
    
    IF criteria.max_annual_volume IS NOT NULL AND 
       COALESCE(agent_performance.volume_closed, 0) > criteria.max_annual_volume THEN
      RETURN false;
    END IF;
    
    -- Check transactions closed
    IF criteria.min_transactions_closed IS NOT NULL AND 
       COALESCE(agent_performance.transactions_closed, 0) < criteria.min_transactions_closed THEN
      RETURN false;
    END IF;
    
    -- Check conversion rate
    IF criteria.min_conversion_rate IS NOT NULL AND 
       COALESCE(agent_performance.conversion_rate, 0) < criteria.min_conversion_rate THEN
      RETURN false;
    END IF;
    
    -- Check average commission
    IF criteria.min_average_commission IS NOT NULL AND 
       COALESCE(agent_performance.average_commission, 0) < criteria.min_average_commission THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Check geographic criteria
  IF criteria.target_states IS NOT NULL AND array_length(criteria.target_states, 1) > 0 THEN
    IF agent_data.state IS NULL OR NOT (agent_data.state = ANY(criteria.target_states)) THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Check NMLS requirement
  IF criteria.requires_nmls = true AND 
     (agent_data.nmls_id IS NULL OR trim(agent_data.nmls_id) = '') THEN
    RETURN false;
  END IF;
  
  -- If all criteria pass, return true
  RETURN true;
END;
$$;

-- Add updated_at trigger
CREATE TRIGGER update_vendor_agent_criteria_updated_at
  BEFORE UPDATE ON public.vendor_agent_criteria
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default criteria for existing vendors (open to all agents)
INSERT INTO public.vendor_agent_criteria (vendor_id, is_active)
SELECT id, true
FROM vendors 
WHERE is_active = true
ON CONFLICT (vendor_id) DO NOTHING;