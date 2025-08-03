-- Add YouTube channel linking to existing tables
ALTER TABLE public.channels 
ADD COLUMN youtube_channel_id TEXT,
ADD COLUMN youtube_channel_url TEXT,
ADD COLUMN auto_imported BOOLEAN DEFAULT false;

-- Create index for faster YouTube channel lookups
CREATE INDEX idx_channels_youtube_channel_id ON public.channels(youtube_channel_id);

-- Update existing auto-imported channels with YouTube data
UPDATE public.channels 
SET auto_imported = true 
WHERE created_at > '2025-01-01' AND creator_id IS NOT NULL;

-- Add function to link YouTube channels to user accounts
CREATE OR REPLACE FUNCTION public.link_youtube_channel_to_user(
  p_user_id UUID,
  p_youtube_channel_id TEXT,
  p_youtube_channel_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  channel_id UUID;
BEGIN
  -- Update existing auto-imported channel or create new one
  INSERT INTO public.channels (
    creator_id, 
    name, 
    youtube_channel_id, 
    youtube_channel_url,
    auto_imported,
    is_verified
  )
  VALUES (
    p_user_id,
    (SELECT display_name FROM public.profiles WHERE user_id = p_user_id),
    p_youtube_channel_id,
    p_youtube_channel_url,
    false, -- User-claimed channel
    true   -- Auto-verify when user claims
  )
  ON CONFLICT (creator_id) DO UPDATE SET
    youtube_channel_id = EXCLUDED.youtube_channel_id,
    youtube_channel_url = EXCLUDED.youtube_channel_url,
    auto_imported = false,
    is_verified = true,
    updated_at = now()
  RETURNING id INTO channel_id;
  
  -- Update all content from this YouTube channel to be owned by the user
  UPDATE public.content 
  SET creator_id = p_user_id
  WHERE metadata->>'channel_title' = (
    SELECT name FROM public.channels WHERE id = channel_id
  ) OR metadata->>'video_id' IN (
    SELECT DISTINCT metadata->>'video_id' 
    FROM public.content 
    WHERE metadata->>'channel_title' = (
      SELECT name FROM public.channels WHERE id = channel_id
    )
  );
  
  RETURN channel_id;
END;
$$;

-- Add enhanced creator info view
CREATE OR REPLACE VIEW public.enhanced_creator_info AS
SELECT 
  c.id as content_id,
  c.creator_id,
  c.metadata,
  -- Platform user info (if creator has account)
  p.display_name as platform_name,
  p.avatar_url as platform_avatar,
  p.bio as platform_bio,
  -- Channel info
  ch.name as channel_name,
  ch.cover_image_url as channel_avatar,
  ch.subscriber_count,
  ch.is_verified as channel_verified,
  ch.youtube_channel_id,
  ch.auto_imported,
  -- Determine which info to show
  CASE 
    WHEN p.user_id IS NOT NULL THEN 'platform_user'
    WHEN ch.creator_id IS NOT NULL AND NOT ch.auto_imported THEN 'claimed_channel'
    ELSE 'youtube_import'
  END as creator_type,
  -- Final display values
  COALESCE(p.display_name, ch.name, c.metadata->>'channel_title', 'Unknown Creator') as display_name,
  COALESCE(p.avatar_url, ch.cover_image_url) as display_avatar,
  COALESCE(ch.subscriber_count, 0) as display_subscribers,
  COALESCE(ch.is_verified, false) as display_verified
FROM public.content c
LEFT JOIN public.profiles p ON c.creator_id = p.user_id
LEFT JOIN public.channels ch ON (
  c.creator_id = ch.creator_id OR 
  c.metadata->>'channel_title' = ch.name
)
WHERE c.content_type = 'video';

-- RLS for enhanced creator info view
ALTER VIEW public.enhanced_creator_info SET (security_invoker = true);

-- Add policies for the enhanced creator info view
CREATE POLICY "Enhanced creator info is viewable by everyone"
ON public.enhanced_creator_info
FOR SELECT
USING (true);