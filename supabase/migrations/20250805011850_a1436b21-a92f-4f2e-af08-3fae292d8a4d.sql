-- Create additional storage buckets for image optimization
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('content-images', 'content-images', true),
  ('channel-covers', 'channel-covers', true),
  ('thumbnails', 'thumbnails', true),
  ('default-images', 'default-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create image_cache table for tracking processed images
CREATE TABLE IF NOT EXISTS public.image_cache (
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

-- Create policy for image_cache (drop first if exists)
DROP POLICY IF EXISTS "Image cache is publicly readable" ON public.image_cache;
CREATE POLICY "Image cache is publicly readable" 
ON public.image_cache FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "System can manage image cache" ON public.image_cache;
CREATE POLICY "System can manage image cache" 
ON public.image_cache FOR ALL 
USING (true);

-- Create basic policies for new buckets
CREATE POLICY "Content images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('content-images', 'channel-covers', 'thumbnails', 'default-images'));

CREATE POLICY "System can manage optimized images" 
ON storage.objects FOR ALL 
USING (bucket_id IN ('content-images', 'channel-covers', 'thumbnails', 'default-images'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_image_cache_original_url ON public.image_cache(original_url);
CREATE INDEX IF NOT EXISTS idx_image_cache_content_id ON public.image_cache(content_id);
CREATE INDEX IF NOT EXISTS idx_image_cache_last_accessed ON public.image_cache(last_accessed);