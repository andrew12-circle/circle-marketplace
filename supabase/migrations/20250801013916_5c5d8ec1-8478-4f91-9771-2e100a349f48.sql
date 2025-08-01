-- Update Andrew Heisley's profile to correctly reference Circle Home Loans
UPDATE public.profiles 
SET 
  business_name = 'Circle Home Loans',
  phone = '615-601-6560',  -- Use the business phone number
  website_url = 'www.circlehomeloans.com/aheisley'
WHERE user_id = '11ea4b95-676e-48cf-83ba-0b6977b4b7cf' AND display_name = 'Andrew Heisley';

-- Add a vendor_profile_link table to properly associate users with vendor companies
CREATE TABLE IF NOT EXISTS public.vendor_user_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner',
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, vendor_id)
);

-- Enable RLS on the association table
ALTER TABLE public.vendor_user_associations ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor user associations
CREATE POLICY "Users can view their own vendor associations" 
ON public.vendor_user_associations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage vendor associations" 
ON public.vendor_user_associations 
FOR ALL 
USING (get_user_admin_status());

-- Create the association between Andrew and Circle Home Loans
INSERT INTO public.vendor_user_associations (user_id, vendor_id, role, is_primary_contact)
VALUES (
  '11ea4b95-676e-48cf-83ba-0b6977b4b7cf',
  '38c34674-47c7-45a1-8f2b-c00477e3c231',
  'owner',
  true
)
ON CONFLICT (user_id, vendor_id) DO UPDATE SET
  role = EXCLUDED.role,
  is_primary_contact = EXCLUDED.is_primary_contact,
  updated_at = now();