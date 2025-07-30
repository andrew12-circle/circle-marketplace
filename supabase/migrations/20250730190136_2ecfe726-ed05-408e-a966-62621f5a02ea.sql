-- Create storage bucket for service images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('service-images', 'service-images', true, 10485760, ARRAY['image/svg+xml']);

-- Create policy for public access to service images
CREATE POLICY "Public access to service images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'service-images');

-- Create policy for authenticated users to upload service images
CREATE POLICY "Authenticated users can upload service images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'service-images' AND auth.role() = 'authenticated');

-- Create policy for users to update their own service images
CREATE POLICY "Users can update service images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'service-images' AND auth.role() = 'authenticated');

-- Create policy for users to delete service images
CREATE POLICY "Users can delete service images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'service-images' AND auth.role() = 'authenticated');