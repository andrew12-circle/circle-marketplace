-- Create vendor commission tracking table
CREATE TABLE IF NOT EXISTS public.vendor_commission_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  report_month TEXT NOT NULL, -- YYYY-MM format
  total_clicks INTEGER NOT NULL DEFAULT 0,
  unique_agents INTEGER NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 5.0,
  estimated_commission NUMERIC NOT NULL DEFAULT 0,
  actual_commission NUMERIC NULL,
  commission_paid BOOLEAN NOT NULL DEFAULT false,
  payment_date DATE NULL,
  report_sent_at TIMESTAMP WITH TIME ZONE NULL,
  report_email_id TEXT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, report_month)
);

-- Enable RLS
ALTER TABLE public.vendor_commission_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage commission tracking" 
ON public.vendor_commission_tracking 
FOR ALL 
USING (get_user_admin_status());

CREATE POLICY "Vendors can view their own commission data" 
ON public.vendor_commission_tracking 
FOR SELECT 
USING (auth.uid() = vendor_id);

-- Create trigger for updated_at
CREATE TRIGGER update_vendor_commission_tracking_updated_at
BEFORE UPDATE ON public.vendor_commission_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_vendor_commission_tracking_vendor_month 
ON public.vendor_commission_tracking(vendor_id, report_month);

-- Add commission tracking to existing vendors table if column doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='commission_rate') THEN
    ALTER TABLE public.profiles ADD COLUMN commission_rate NUMERIC DEFAULT 5.0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='commission_contact_email') THEN
    ALTER TABLE public.profiles ADD COLUMN commission_contact_email TEXT;
  END IF;
END $$;