-- Create point allocations table for vendor-to-agent point grants
CREATE TABLE public.point_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  allocated_points INTEGER NOT NULL,
  used_points INTEGER DEFAULT 0,
  remaining_points INTEGER GENERATED ALWAYS AS (allocated_points - used_points) STORED,
  allocation_period TEXT NOT NULL, -- 'Q1_2024', 'Q2_2024', 'monthly_2024_01', etc
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  
  CONSTRAINT unique_vendor_agent_period UNIQUE (vendor_id, agent_id, allocation_period)
);

-- Create point transactions table to track usage
CREATE TABLE public.point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id UUID NOT NULL REFERENCES public.point_allocations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  service_id UUID,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deduction', 'refund', 'adjustment')),
  points_used INTEGER NOT NULL,
  amount_covered NUMERIC(10,2) NOT NULL, -- Dollar amount this covered
  coverage_percentage INTEGER NOT NULL, -- What % the vendor covered
  total_service_amount NUMERIC(10,2), -- Total service cost
  order_id UUID, -- Link to actual purchase
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_by UUID
);

-- Enable RLS
ALTER TABLE public.point_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for point_allocations
CREATE POLICY "Agents can view their own allocations" 
ON public.point_allocations 
FOR SELECT 
USING (auth.uid() = agent_id);

CREATE POLICY "Vendors can view their own allocations" 
ON public.point_allocations 
FOR SELECT 
USING (auth.uid() = vendor_id);

CREATE POLICY "Vendors can create allocations" 
ON public.point_allocations 
FOR INSERT 
WITH CHECK (auth.uid() = vendor_id);

CREATE POLICY "Vendors can update their own allocations" 
ON public.point_allocations 
FOR UPDATE 
USING (auth.uid() = vendor_id);

CREATE POLICY "Admins can manage all allocations" 
ON public.point_allocations 
FOR ALL 
USING (get_user_admin_status());

-- RLS Policies for point_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.point_transactions 
FOR SELECT 
USING (auth.uid() = agent_id OR auth.uid() = vendor_id);

CREATE POLICY "System can create transactions" 
ON public.point_transactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all transactions" 
ON public.point_transactions 
FOR ALL 
USING (get_user_admin_status());

-- Function to automatically deduct points for co-pay
CREATE OR REPLACE FUNCTION public.process_automatic_copay(
  p_agent_id UUID,
  p_service_id UUID,
  p_vendor_id UUID,
  p_total_amount NUMERIC,
  p_coverage_percentage INTEGER,
  p_order_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  points_needed INTEGER;
  amount_to_cover NUMERIC;
  allocation_record RECORD;
  transaction_id UUID;
  result JSONB;
BEGIN
  -- Calculate how much we need to cover and points needed
  amount_to_cover := p_total_amount * (p_coverage_percentage / 100.0);
  points_needed := CEIL(amount_to_cover); -- Each point = $1
  
  -- Find active allocation with enough points
  SELECT * INTO allocation_record
  FROM public.point_allocations
  WHERE vendor_id = p_vendor_id
    AND agent_id = p_agent_id
    AND status = 'active'
    AND start_date <= CURRENT_DATE
    AND end_date >= CURRENT_DATE
    AND remaining_points >= points_needed
  ORDER BY end_date ASC -- Use earliest expiring first
  LIMIT 1;
  
  -- Check if we found a valid allocation
  IF allocation_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_points',
      'message', 'No active point allocation found with sufficient balance',
      'points_needed', points_needed,
      'amount_to_cover', amount_to_cover
    );
  END IF;
  
  -- Update the allocation to reflect used points
  UPDATE public.point_allocations
  SET used_points = used_points + points_needed,
      updated_at = now()
  WHERE id = allocation_record.id;
  
  -- Create transaction record
  INSERT INTO public.point_transactions (
    allocation_id, agent_id, vendor_id, service_id, transaction_type,
    points_used, amount_covered, coverage_percentage, total_service_amount,
    order_id, description
  ) VALUES (
    allocation_record.id, p_agent_id, p_vendor_id, p_service_id, 'deduction',
    points_needed, amount_to_cover, p_coverage_percentage, p_total_amount,
    p_order_id, 'Automatic co-pay deduction'
  ) RETURNING id INTO transaction_id;
  
  -- Return success result
  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'points_used', points_needed,
    'amount_covered', amount_to_cover,
    'remaining_points', allocation_record.remaining_points - points_needed,
    'allocation_id', allocation_record.id
  );
END;
$$;

-- Function to get agent's available points summary
CREATE OR REPLACE FUNCTION public.get_agent_points_summary(p_agent_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  total_points INTEGER := 0;
  active_allocations INTEGER := 0;
  result JSONB;
BEGIN
  -- Get summary of active allocations
  SELECT 
    COALESCE(SUM(remaining_points), 0),
    COUNT(*)
  INTO total_points, active_allocations
  FROM public.point_allocations
  WHERE agent_id = p_agent_id
    AND status = 'active'
    AND start_date <= CURRENT_DATE
    AND end_date >= CURRENT_DATE;
  
  -- Build detailed result
  SELECT jsonb_build_object(
    'total_available_points', total_points,
    'total_dollar_value', total_points,
    'active_allocations_count', active_allocations,
    'allocations', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'vendor_id', pa.vendor_id,
          'vendor_name', COALESCE(p.business_name, p.display_name),
          'allocated_points', pa.allocated_points,
          'used_points', pa.used_points,
          'remaining_points', pa.remaining_points,
          'allocation_period', pa.allocation_period,
          'end_date', pa.end_date,
          'notes', pa.notes
        )
      ) FILTER (WHERE pa.id IS NOT NULL),
      '[]'::jsonb
    )
  ) INTO result
  FROM public.point_allocations pa
  LEFT JOIN public.profiles p ON p.user_id = pa.vendor_id
  WHERE pa.agent_id = p_agent_id
    AND pa.status = 'active'
    AND pa.start_date <= CURRENT_DATE
    AND pa.end_date >= CURRENT_DATE;
  
  RETURN COALESCE(result, jsonb_build_object(
    'total_available_points', 0,
    'total_dollar_value', 0,
    'active_allocations_count', 0,
    'allocations', '[]'::jsonb
  ));
END;
$$;

-- Add indexes for performance
CREATE INDEX idx_point_allocations_agent_active ON public.point_allocations(agent_id, status, start_date, end_date);
CREATE INDEX idx_point_allocations_vendor ON public.point_allocations(vendor_id);
CREATE INDEX idx_point_transactions_agent ON public.point_transactions(agent_id);
CREATE INDEX idx_point_transactions_allocation ON public.point_transactions(allocation_id);

-- Add trigger for updated_at
CREATE TRIGGER update_point_allocations_updated_at
  BEFORE UPDATE ON public.point_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();