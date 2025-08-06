-- Add document storage support for RESPA compliance
-- Create storage bucket for RESPA documents
INSERT INTO storage.buckets (id, name, public) VALUES ('respa-documents', 'respa-documents', false);

-- Create policies for RESPA document storage
CREATE POLICY "Admin can upload RESPA documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'respa-documents' AND get_user_admin_status());

CREATE POLICY "Admin can view RESPA documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'respa-documents' AND get_user_admin_status());

CREATE POLICY "Admin can update RESPA documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'respa-documents' AND get_user_admin_status());

CREATE POLICY "Admin can delete RESPA documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'respa-documents' AND get_user_admin_status());

-- Add columns to services table for regulatory documentation
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS regulatory_findings text,
ADD COLUMN IF NOT EXISTS supporting_documents jsonb DEFAULT '[]'::jsonb;