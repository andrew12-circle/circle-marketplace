-- Add pricing screenshot fields to vendors table
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS pricing_screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS pricing_screenshot_captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pricing_url TEXT;

-- Create storage bucket for vendor pricing screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor-pricing-screenshots', 'vendor-pricing-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for vendor pricing screenshots
CREATE POLICY "Admin can upload vendor pricing screenshots"
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'vendor-pricing-screenshots' AND get_user_admin_status());

CREATE POLICY "Everyone can view vendor pricing screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor-pricing-screenshots');

CREATE POLICY "Admin can update vendor pricing screenshots"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vendor-pricing-screenshots' AND get_user_admin_status());

CREATE POLICY "Admin can delete vendor pricing screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'vendor-pricing-screenshots' AND get_user_admin_status());