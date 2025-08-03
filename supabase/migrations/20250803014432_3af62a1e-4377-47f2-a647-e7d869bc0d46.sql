-- Remove the problematic security definer function and create a proper one
DROP FUNCTION IF EXISTS public.get_enhanced_creator_info(UUID);

-- Create a proper function that follows security best practices
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
STABLE
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