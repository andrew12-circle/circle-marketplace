-- Create vendor referrals table for tracking agent referrals
CREATE TABLE public.vendor_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL,
  vendor_name TEXT NOT NULL,
  vendor_email TEXT NOT NULL,
  vendor_phone TEXT,
  vendor_company TEXT,
  vendor_type TEXT, -- 'lender', 'title_company', 'inspector', etc.
  relationship TEXT, -- 'current_partner', 'preferred', 'recommended'
  service_interest TEXT, -- What service they might help with
  referral_notes TEXT,
  contact_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'contacted', 'scheduled', 'onboarded', 'declined'
  contacted_at TIMESTAMP WITH TIME ZONE,
  scheduled_call_at TIMESTAMP WITH TIME ZONE,
  status_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vendor_referrals ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor referrals
CREATE POLICY "Agents can create their own referrals" 
ON public.vendor_referrals 
FOR INSERT 
WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can view their own referrals" 
ON public.vendor_referrals 
FOR SELECT 
USING (auth.uid() = agent_id);

CREATE POLICY "Agents can update their own referrals" 
ON public.vendor_referrals 
FOR UPDATE 
USING (auth.uid() = agent_id);

CREATE POLICY "Admins can manage all referrals" 
ON public.vendor_referrals 
FOR ALL 
USING (get_user_admin_status());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vendor_referrals_updated_at
BEFORE UPDATE ON public.vendor_referrals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();