-- Add pricing screenshot fields to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS pricing_screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS pricing_screenshot_captured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pricing_page_url TEXT;

-- Create storage bucket for service pricing screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-pricing-screenshots', 'service-pricing-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for service pricing screenshots
CREATE POLICY "Admin can upload service pricing screenshots"
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'service-pricing-screenshots' AND get_user_admin_status());

CREATE POLICY "Everyone can view service pricing screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-pricing-screenshots');

CREATE POLICY "Admin can update service pricing screenshots"
ON storage.objects FOR UPDATE
USING (bucket_id = 'service-pricing-screenshots' AND get_user_admin_status());

CREATE POLICY "Admin can delete service pricing screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'service-pricing-screenshots' AND get_user_admin_status());