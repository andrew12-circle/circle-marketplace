-- Create affiliate email logs table
CREATE TABLE IF NOT EXISTS public.affiliate_email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  email_address TEXT NOT NULL,
  email_id TEXT, -- Resend email ID
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliate_email_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Affiliates can view their own email logs" 
ON public.affiliate_email_logs 
FOR SELECT 
USING (
  affiliate_id IN (
    SELECT id FROM public.affiliates WHERE user_id = auth.uid()
  )
);

-- Admins can view all email logs
CREATE POLICY "Admins can view all email logs" 
ON public.affiliate_email_logs 
FOR ALL 
USING (get_user_admin_status() = true);

-- Create index for performance
CREATE INDEX idx_affiliate_email_logs_affiliate_id ON public.affiliate_email_logs(affiliate_id);
CREATE INDEX idx_affiliate_email_logs_sent_at ON public.affiliate_email_logs(sent_at DESC);