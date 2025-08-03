-- Enable RLS on content table if not already enabled
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published content
CREATE POLICY "Public read access to published content"
ON public.content
FOR SELECT
USING (is_published = true);

-- Enable RLS on channels table if not already enabled
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Allow public read access to channels
CREATE POLICY "Public read access to channels"
ON public.channels
FOR SELECT
USING (true);

-- Enable RLS on content_ratings table if not already enabled
ALTER TABLE public.content_ratings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to content ratings
CREATE POLICY "Public read access to content ratings"
ON public.content_ratings
FOR SELECT
USING (true);

-- Allow authenticated users to create and manage their own ratings
CREATE POLICY "Users can manage their own content ratings"
ON public.content_ratings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create or replace the increment_content_plays function if it doesn't exist
CREATE OR REPLACE FUNCTION public.increment_content_plays(content_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.content
  SET total_plays = COALESCE(total_plays, 0) + 1
  WHERE id = content_uuid AND is_published = true;
END;
$$;