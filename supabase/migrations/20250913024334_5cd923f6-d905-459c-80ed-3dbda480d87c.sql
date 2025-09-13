-- Create storage bucket for compliance evidence
INSERT INTO storage.buckets (id, name, public) VALUES ('compliance-evidence', 'compliance-evidence', true);

-- Create policies for compliance evidence uploads
CREATE POLICY "Authenticated users can upload compliance evidence" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'compliance-evidence' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view compliance evidence" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'compliance-evidence' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update their compliance evidence" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'compliance-evidence' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete their compliance evidence" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'compliance-evidence' AND auth.uid() IS NOT NULL);