-- Create storage bucket for funnel media
INSERT INTO storage.buckets (id, name, public) VALUES ('funnel-media', 'funnel-media', true);

-- Create policies for funnel media uploads
CREATE POLICY "Anyone can view funnel media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'funnel-media');

CREATE POLICY "Authenticated users can upload funnel media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'funnel-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own funnel media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'funnel-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own funnel media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'funnel-media' AND auth.uid()::text = (storage.foldername(name))[1]);