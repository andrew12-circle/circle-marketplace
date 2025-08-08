-- Add commission tracking and agreement management fields to vendors table
ALTER TABLE public.vendors 
ADD COLUMN circle_commission_percentage NUMERIC(5,2) DEFAULT 0.00,
ADD COLUMN commission_type TEXT DEFAULT 'percentage',
ADD COLUMN minimum_commission_amount NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN commission_notes TEXT,
ADD COLUMN agreement_notes TEXT,
ADD COLUMN agreement_documents JSONB DEFAULT '{}',
ADD COLUMN agreement_start_date DATE,
ADD COLUMN agreement_renewal_date DATE,
ADD COLUMN payment_terms TEXT;

-- Create vendor_commissions table for tracking actual commission payments
CREATE TABLE public.vendor_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  transaction_id TEXT,
  commission_amount NUMERIC(10,2) NOT NULL,
  commission_percentage NUMERIC(5,2),
  sale_amount NUMERIC(10,2),
  payment_status TEXT DEFAULT 'pending',
  payment_date DATE,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vendor_commissions
ALTER TABLE public.vendor_commissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vendor_commissions
CREATE POLICY "Admins can manage all vendor commissions"
ON public.vendor_commissions
FOR ALL
USING (get_user_admin_status());

-- Create function to auto-calculate vendor rankings based on commission
CREATE OR REPLACE FUNCTION public.calculate_vendor_ranking()
RETURNS TRIGGER AS $$
BEGIN
  -- Update sort_order based on commission percentage (higher commission = lower sort_order = higher ranking)
  UPDATE public.vendors 
  SET sort_order = CASE 
    WHEN circle_commission_percentage >= 15 THEN 1
    WHEN circle_commission_percentage >= 10 THEN 2
    WHEN circle_commission_percentage >= 5 THEN 3
    WHEN circle_commission_percentage >= 2 THEN 4
    ELSE 5
  END
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update rankings when commission changes
CREATE TRIGGER update_vendor_ranking
  AFTER INSERT OR UPDATE OF circle_commission_percentage
  ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_vendor_ranking();

-- Create trigger for updated_at on vendor_commissions
CREATE TRIGGER update_vendor_commissions_updated_at
  BEFORE UPDATE ON public.vendor_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();