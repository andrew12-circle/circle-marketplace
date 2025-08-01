-- Add payment method storage for vendors
ALTER TABLE public.point_allocations 
ADD COLUMN stripe_payment_method_id TEXT,
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN pre_authorized BOOLEAN DEFAULT false,
ADD COLUMN charge_on_use BOOLEAN DEFAULT true;

-- Create table to track real-time charges
CREATE TABLE public.point_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id UUID REFERENCES public.point_allocations(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.point_transactions(id),
  vendor_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  points_charged INTEGER NOT NULL,
  amount_charged NUMERIC NOT NULL,
  stripe_charge_id TEXT,
  stripe_payment_intent_id TEXT,
  charge_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  error_message TEXT
);

-- Enable RLS on point_charges
ALTER TABLE public.point_charges ENABLE ROW LEVEL SECURITY;

-- Create policies for point_charges
CREATE POLICY "Vendors can view their own charges" ON public.point_charges
FOR SELECT
USING (auth.uid() = vendor_id);

CREATE POLICY "Agents can view charges for their transactions" ON public.point_charges
FOR SELECT
USING (auth.uid() = agent_id);

CREATE POLICY "System can create charges" ON public.point_charges
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update charges" ON public.point_charges
FOR UPDATE
USING (true);

-- Create function to process real-time charging
CREATE OR REPLACE FUNCTION public.process_real_time_charge(
  p_allocation_id UUID,
  p_transaction_id UUID,
  p_vendor_id UUID,
  p_agent_id UUID,
  p_points_used INTEGER,
  p_amount_to_charge NUMERIC
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  allocation_record RECORD;
  charge_id UUID;
  result JSONB;
BEGIN
  -- Get allocation details including payment method
  SELECT * INTO allocation_record
  FROM public.point_allocations
  WHERE id = p_allocation_id
    AND vendor_id = p_vendor_id
    AND charge_on_use = true
    AND stripe_payment_method_id IS NOT NULL;
  
  IF allocation_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_payment_method',
      'message', 'No valid payment method found for this allocation'
    );
  END IF;
  
  -- Create charge record
  INSERT INTO public.point_charges (
    allocation_id, transaction_id, vendor_id, agent_id,
    points_charged, amount_charged, charge_status
  ) VALUES (
    p_allocation_id, p_transaction_id, p_vendor_id, p_agent_id,
    p_points_used, p_amount_to_charge, 'pending'
  ) RETURNING id INTO charge_id;
  
  -- Return data for Stripe processing
  RETURN jsonb_build_object(
    'success', true,
    'charge_id', charge_id,
    'stripe_customer_id', allocation_record.stripe_customer_id,
    'stripe_payment_method_id', allocation_record.stripe_payment_method_id,
    'amount_to_charge', p_amount_to_charge,
    'points_charged', p_points_used
  );
END;
$$;