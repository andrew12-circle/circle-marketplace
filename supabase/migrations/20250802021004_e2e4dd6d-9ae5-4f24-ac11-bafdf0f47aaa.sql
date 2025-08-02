-- Add RESPA compliance fields to point_allocations table
ALTER TABLE public.point_allocations 
ADD COLUMN IF NOT EXISTS vendor_respa_status boolean,
ADD COLUMN IF NOT EXISTS vendor_respa_category text,
ADD COLUMN IF NOT EXISTS respa_compliance_notes text;

-- Add RESPA fields to service_providers table if they don't exist
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS respa_risk_level text DEFAULT 'medium';

-- Create function to calculate RESPA-compliant point usage
CREATE OR REPLACE FUNCTION public.calculate_respa_compliant_usage(
  p_service_id uuid,
  p_agent_id uuid,
  p_total_amount numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  service_record RECORD;
  respa_allocations RECORD;
  non_respa_allocations RECORD;
  max_respa_coverage numeric := 0;
  max_non_respa_coverage numeric := 0;
  result jsonb;
BEGIN
  -- Get service details
  SELECT s.*, sp.is_respa_regulated, sp.respa_risk_level
  INTO service_record
  FROM public.services s
  LEFT JOIN public.service_providers sp ON s.service_provider_id = sp.id
  WHERE s.id = p_service_id;
  
  IF service_record.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Service not found');
  END IF;
  
  -- Calculate available RESPA points
  SELECT 
    COALESCE(SUM(remaining_points), 0) as total_points,
    COALESCE(SUM(remaining_points), 0) as total_amount
  INTO respa_allocations
  FROM public.point_allocations pa
  WHERE pa.agent_id = p_agent_id
    AND pa.status = 'active'
    AND pa.start_date <= CURRENT_DATE
    AND pa.end_date >= CURRENT_DATE
    AND pa.vendor_respa_status = true;
  
  -- Calculate available non-RESPA points
  SELECT 
    COALESCE(SUM(remaining_points), 0) as total_points,
    COALESCE(SUM(remaining_points), 0) as total_amount
  INTO non_respa_allocations
  FROM public.point_allocations pa
  WHERE pa.agent_id = p_agent_id
    AND pa.status = 'active'
    AND pa.start_date <= CURRENT_DATE
    AND pa.end_date >= CURRENT_DATE
    AND (pa.vendor_respa_status = false OR pa.vendor_respa_status IS NULL);
  
  -- Determine RESPA coverage rules based on service category
  IF service_record.respa_category = 'settlement' THEN
    -- Settlement services: RESPA vendors can only cover marketing portion (typically 25-50%)
    max_respa_coverage := LEAST(respa_allocations.total_amount, p_total_amount * 0.25);
  ELSIF service_record.respa_category = 'adjacent' THEN
    -- RESPA-adjacent: More flexible but still limited (typically 50-75%)
    max_respa_coverage := LEAST(respa_allocations.total_amount, p_total_amount * 0.50);
  ELSE
    -- Non-RESPA or unclassified: RESPA vendors can cover marketing portion only
    max_respa_coverage := LEAST(respa_allocations.total_amount, p_total_amount * 0.25);
  END IF;
  
  -- Non-RESPA vendors can always cover 100% if available
  max_non_respa_coverage := LEAST(non_respa_allocations.total_amount, p_total_amount);
  
  -- Build result
  result := jsonb_build_object(
    'service_respa_category', service_record.respa_category,
    'total_amount', p_total_amount,
    'respa_points_available', respa_allocations.total_amount,
    'non_respa_points_available', non_respa_allocations.total_amount,
    'max_respa_coverage', max_respa_coverage,
    'max_non_respa_coverage', max_non_respa_coverage,
    'total_max_coverage', max_respa_coverage + max_non_respa_coverage,
    'can_cover_full_amount', (max_respa_coverage + max_non_respa_coverage) >= p_total_amount,
    'coverage_breakdown', jsonb_build_object(
      'respa_portion', max_respa_coverage,
      'non_respa_portion', LEAST(max_non_respa_coverage, p_total_amount - max_respa_coverage),
      'agent_pays', GREATEST(0, p_total_amount - max_respa_coverage - max_non_respa_coverage)
    )
  );
  
  RETURN result;
END;
$$;

-- Create function to process RESPA-compliant point transactions
CREATE OR REPLACE FUNCTION public.process_respa_compliant_transaction(
  p_service_id uuid,
  p_agent_id uuid,
  p_vendor_id uuid,
  p_total_amount numeric,
  p_order_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  coverage_calc jsonb;
  respa_coverage numeric;
  non_respa_coverage numeric;
  respa_allocation_id uuid;
  non_respa_allocation_id uuid;
  respa_transaction_id uuid;
  non_respa_transaction_id uuid;
  result jsonb;
BEGIN
  -- Calculate RESPA-compliant coverage
  SELECT public.calculate_respa_compliant_usage(p_service_id, p_agent_id, p_total_amount)
  INTO coverage_calc;
  
  -- Extract coverage amounts
  respa_coverage := (coverage_calc->'coverage_breakdown'->>'respa_portion')::numeric;
  non_respa_coverage := (coverage_calc->'coverage_breakdown'->>'non_respa_portion')::numeric;
  
  -- Process RESPA allocation if needed
  IF respa_coverage > 0 THEN
    -- Find best RESPA allocation
    SELECT id INTO respa_allocation_id
    FROM public.point_allocations
    WHERE agent_id = p_agent_id
      AND vendor_id = p_vendor_id
      AND status = 'active'
      AND vendor_respa_status = true
      AND remaining_points >= respa_coverage
    ORDER BY end_date ASC
    LIMIT 1;
    
    IF respa_allocation_id IS NOT NULL THEN
      -- Update allocation
      UPDATE public.point_allocations
      SET used_points = used_points + respa_coverage,
          updated_at = now()
      WHERE id = respa_allocation_id;
      
      -- Create transaction
      INSERT INTO public.point_transactions (
        allocation_id, agent_id, vendor_id, service_id, transaction_type,
        points_used, amount_covered, coverage_percentage, total_service_amount,
        order_id, description
      ) VALUES (
        respa_allocation_id, p_agent_id, p_vendor_id, p_service_id, 'deduction',
        respa_coverage, respa_coverage, 
        ROUND((respa_coverage / p_total_amount) * 100),
        p_total_amount, p_order_id,
        'RESPA-compliant partial coverage'
      ) RETURNING id INTO respa_transaction_id;
    END IF;
  END IF;
  
  -- Process non-RESPA allocation if needed
  IF non_respa_coverage > 0 THEN
    -- Find best non-RESPA allocation
    SELECT id INTO non_respa_allocation_id
    FROM public.point_allocations
    WHERE agent_id = p_agent_id
      AND vendor_id = p_vendor_id
      AND status = 'active'
      AND (vendor_respa_status = false OR vendor_respa_status IS NULL)
      AND remaining_points >= non_respa_coverage
    ORDER BY end_date ASC
    LIMIT 1;
    
    IF non_respa_allocation_id IS NOT NULL THEN
      -- Update allocation
      UPDATE public.point_allocations
      SET used_points = used_points + non_respa_coverage,
          updated_at = now()
      WHERE id = non_respa_allocation_id;
      
      -- Create transaction
      INSERT INTO public.point_transactions (
        allocation_id, agent_id, vendor_id, service_id, transaction_type,
        points_used, amount_covered, coverage_percentage, total_service_amount,
        order_id, description
      ) VALUES (
        non_respa_allocation_id, p_agent_id, p_vendor_id, p_service_id, 'deduction',
        non_respa_coverage, non_respa_coverage,
        ROUND((non_respa_coverage / p_total_amount) * 100),
        p_total_amount, p_order_id,
        'Non-RESPA full coverage'
      ) RETURNING id INTO non_respa_transaction_id;
    END IF;
  END IF;
  
  -- Return result
  result := jsonb_build_object(
    'success', true,
    'coverage_calculation', coverage_calc,
    'transactions', jsonb_build_object(
      'respa_transaction_id', respa_transaction_id,
      'non_respa_transaction_id', non_respa_transaction_id,
      'total_covered', respa_coverage + non_respa_coverage,
      'agent_balance_due', p_total_amount - respa_coverage - non_respa_coverage
    )
  );
  
  RETURN result;
END;
$$;

-- Update existing point allocations to track RESPA status based on vendor
UPDATE public.point_allocations 
SET vendor_respa_status = (
  SELECT sp.is_respa_regulated 
  FROM public.service_providers sp 
  WHERE sp.id::text = point_allocations.vendor_id::text
),
vendor_respa_category = (
  SELECT 
    CASE 
      WHEN sp.is_respa_regulated = true THEN 'settlement'
      WHEN sp.is_respa_regulated = false THEN 'non-respa'
      ELSE 'unknown'
    END
  FROM public.service_providers sp 
  WHERE sp.id::text = point_allocations.vendor_id::text
)
WHERE vendor_respa_status IS NULL;