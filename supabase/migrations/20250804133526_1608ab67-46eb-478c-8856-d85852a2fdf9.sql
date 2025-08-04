-- Add duration and contract management to co_pay_requests
ALTER TABLE public.co_pay_requests 
ADD COLUMN IF NOT EXISTS payment_duration_months integer DEFAULT 12,
ADD COLUMN IF NOT EXISTS payment_start_date date,
ADD COLUMN IF NOT EXISTS payment_end_date date,
ADD COLUMN IF NOT EXISTS auto_renewal boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS renewal_notification_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS contract_terms jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS vendor_max_percentage integer,
ADD COLUMN IF NOT EXISTS vendor_duration_limit_months integer;

-- Create a table for tracking payment schedules and renewals
CREATE TABLE IF NOT EXISTS public.copay_payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  co_pay_request_id UUID NOT NULL REFERENCES public.co_pay_requests(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  payment_percentage INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'renewed')),
  total_amount_covered NUMERIC DEFAULT 0,
  auto_renewal BOOLEAN DEFAULT false,
  renewal_notice_days INTEGER DEFAULT 30,
  next_renewal_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.copay_payment_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for payment schedules
CREATE POLICY "Users can view their own payment schedules" 
ON public.copay_payment_schedules 
FOR SELECT 
USING (auth.uid() = agent_id OR auth.uid() = vendor_id);

CREATE POLICY "Vendors can manage payment schedules" 
ON public.copay_payment_schedules 
FOR ALL 
USING (auth.uid() = vendor_id);

CREATE POLICY "Agents can view payment schedules" 
ON public.copay_payment_schedules 
FOR SELECT 
USING (auth.uid() = agent_id);

-- Function to check for expiring payment schedules
CREATE OR REPLACE FUNCTION public.check_expiring_payment_schedules()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Insert notifications for schedules expiring in 30 days
  INSERT INTO public.consultation_notifications (
    vendor_id,
    consultation_booking_id,
    notification_type,
    notification_data,
    status
  )
  SELECT 
    cps.vendor_id,
    cpr.id::uuid,
    'payment_schedule_renewal',
    jsonb_build_object(
      'schedule_id', cps.id,
      'agent_name', p.display_name,
      'service_title', s.title,
      'current_percentage', cps.payment_percentage,
      'expires_on', cps.end_date,
      'days_until_expiry', (cps.end_date - CURRENT_DATE)
    ),
    'pending'
  FROM public.copay_payment_schedules cps
  JOIN public.co_pay_requests cpr ON cpr.id = cps.co_pay_request_id
  JOIN public.profiles p ON p.user_id = cps.agent_id
  JOIN public.services s ON s.id = cpr.service_id
  WHERE cps.status = 'active'
    AND cps.end_date <= CURRENT_DATE + INTERVAL '30 days'
    AND cps.end_date > CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.consultation_notifications cn 
      WHERE cn.vendor_id = cps.vendor_id 
        AND cn.notification_data->>'schedule_id' = cps.id::text
        AND cn.notification_type = 'payment_schedule_renewal'
        AND cn.created_at > CURRENT_DATE - INTERVAL '7 days'
    );
END;
$$;