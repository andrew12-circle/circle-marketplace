-- Phase 1 & 2: Create marketplace_cache table and missing indexes
CREATE TABLE IF NOT EXISTS public.marketplace_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for marketplace_cache
CREATE POLICY "Cache is publicly readable" 
ON public.marketplace_cache 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage cache" 
ON public.marketplace_cache 
FOR ALL 
USING (true);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_cache_key ON public.marketplace_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_marketplace_cache_expires ON public.marketplace_cache(expires_at);

-- Performance indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_content_creator_id ON public.content(creator_id);
CREATE INDEX IF NOT EXISTS idx_content_published ON public.content(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_category ON public.content(category);
CREATE INDEX IF NOT EXISTS idx_channels_creator_id ON public.channels(creator_id);
CREATE INDEX IF NOT EXISTS idx_channels_youtube_id ON public.channels(youtube_channel_id);

-- Cache cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  DELETE FROM public.marketplace_cache 
  WHERE expires_at < now();
END;
$$;

-- Create system user profile if it doesn't exist
INSERT INTO public.profiles (
  user_id,
  display_name,
  bio,
  specialties,
  is_admin,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'System Auto-Import',
  'Automated content import system for YouTube channels and videos',
  ARRAY['system', 'content_curator'],
  false,
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  specialties = EXCLUDED.specialties,
  updated_at = now();