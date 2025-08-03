-- Add YouTube channel linking to existing tables
ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS youtube_channel_id TEXT,
ADD COLUMN IF NOT EXISTS youtube_channel_url TEXT,
ADD COLUMN IF NOT EXISTS auto_imported BOOLEAN DEFAULT false;

-- Create index for faster YouTube channel lookups
CREATE INDEX IF NOT EXISTS idx_channels_youtube_channel_id ON public.channels(youtube_channel_id);

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
  );
  
  RETURN channel_id;
END;
$$;

-- Add function to get enhanced creator info
CREATE OR REPLACE FUNCTION public.get_enhanced_creator_info(p_content_id UUID)
RETURNS TABLE (
  creator_type TEXT,
  display_name TEXT,
  display_avatar TEXT,
  display_subscribers INTEGER,
  display_verified BOOLEAN,
  platform_bio TEXT,
  youtube_channel_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN p.user_id IS NOT NULL THEN 'platform_user'::TEXT
      WHEN ch.creator_id IS NOT NULL AND NOT COALESCE(ch.auto_imported, true) THEN 'claimed_channel'::TEXT
      ELSE 'youtube_import'::TEXT
    END as creator_type,
    COALESCE(p.display_name, ch.name, c.metadata->>'channel_title', 'Unknown Creator')::TEXT as display_name,
    COALESCE(p.avatar_url, ch.cover_image_url)::TEXT as display_avatar,
    COALESCE(ch.subscriber_count, 0)::INTEGER as display_subscribers,
    COALESCE(ch.is_verified, false)::BOOLEAN as display_verified,
    p.bio::TEXT as platform_bio,
    ch.youtube_channel_id::TEXT as youtube_channel_id
  FROM public.content c
  LEFT JOIN public.profiles p ON c.creator_id = p.user_id
  LEFT JOIN public.channels ch ON (
    c.creator_id = ch.creator_id OR 
    c.metadata->>'channel_title' = ch.name
  )
  WHERE c.id = p_content_id;
END;
$$;