-- Add approval and automation columns to vendors table
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'auto_approved', 'needs_review', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS auto_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS automated_checks JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Ensure services table has is_active column
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Update vendors RLS policy for public visibility
DROP POLICY IF EXISTS "Vendors are viewable by everyone" ON public.vendors;
CREATE POLICY "Approved vendors are viewable by everyone" 
ON public.vendors 
FOR SELECT 
USING (is_active = true AND approval_status IN ('auto_approved', 'approved'));

-- Admin can view all vendors
CREATE POLICY "Admins can view all vendors" 
ON public.vendors 
FOR SELECT 
USING (get_user_admin_status());

-- Update services RLS for active services only
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
CREATE POLICY "Active services are viewable by everyone" 
ON public.services 
FOR SELECT 
USING (is_active = true);

-- Admin can view all services  
CREATE POLICY "Admins can view all services" 
ON public.services 
FOR SELECT 
USING (get_user_admin_status());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_approval_status ON public.vendors(approval_status);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON public.vendors(is_active);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

-- Create function to auto-create vendor record
CREATE OR REPLACE FUNCTION public.auto_create_vendor_record()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create vendor record if user doesn't already have one
  IF NOT EXISTS (SELECT 1 FROM public.vendors WHERE id = NEW.id) THEN
    INSERT INTO public.vendors (
      id, 
      name, 
      contact_email,
      approval_status,
      is_active,
      is_verified,
      auto_score
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.raw_user_meta_data->>'name', 'New Vendor'),
      NEW.email,
      'pending',
      false,
      false,
      0
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto vendor creation
DROP TRIGGER IF EXISTS on_auth_user_vendor_created ON auth.users;
CREATE TRIGGER on_auth_user_vendor_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.auto_create_vendor_record();