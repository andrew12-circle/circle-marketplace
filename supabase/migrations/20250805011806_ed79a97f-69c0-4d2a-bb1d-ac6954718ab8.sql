-- Create storage buckets for optimized image management
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('content-images', 'content-images', true),
  ('user-avatars', 'user-avatars', true),
  ('channel-covers', 'channel-covers', true),
  ('thumbnails', 'thumbnails', true),
  ('default-images', 'default-images', true);

-- Create policies for content images
CREATE POLICY "Content images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'content-images');

CREATE POLICY "Authenticated users can upload content images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'content-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their content images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'content-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for user avatars
CREATE POLICY "User avatars are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create policies for channel covers
CREATE POLICY "Channel covers are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'channel-covers');

CREATE POLICY "Authenticated users can upload channel covers" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'channel-covers' AND auth.role() = 'authenticated');

-- Create policies for thumbnails
CREATE POLICY "Thumbnails are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'thumbnails');

CREATE POLICY "System can manage thumbnails" 
ON storage.objects FOR ALL 
USING (bucket_id = 'thumbnails');

-- Create policies for default images
CREATE POLICY "Default images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'default-images');

CREATE POLICY "System can manage default images" 
ON storage.objects FOR ALL 
USING (bucket_id = 'default-images');

-- Create image_cache table for tracking processed images
CREATE TABLE public.image_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_url TEXT NOT NULL,
  cached_url TEXT NOT NULL,
  image_type TEXT NOT NULL, -- 'thumbnail', 'avatar', 'cover', 'content'
  content_id UUID,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  format TEXT, -- 'webp', 'jpeg', 'png'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(original_url, image_type)
);

-- Enable RLS on image_cache
ALTER TABLE public.image_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for image_cache
CREATE POLICY "Image cache is publicly readable" 
ON public.image_cache FOR SELECT 
USING (true);

CREATE POLICY "System can manage image cache" 
ON public.image_cache FOR ALL 
USING (auth.role() = 'service_role' OR auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_image_cache_original_url ON public.image_cache(original_url);
CREATE INDEX idx_image_cache_content_id ON public.image_cache(content_id);
CREATE INDEX idx_image_cache_last_accessed ON public.image_cache(last_accessed);