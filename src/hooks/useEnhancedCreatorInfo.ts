import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface EnhancedCreatorInfo {
  creator_type: 'platform_user' | 'claimed_channel' | 'youtube_import';
  display_name: string;
  display_avatar: string | null;
  display_subscribers: number;
  display_verified: boolean;
  platform_bio: string | null;
  youtube_channel_id: string | null;
}

export const useEnhancedCreatorInfo = (contentId: string | undefined) => {
  const [creatorInfo, setCreatorInfo] = useState<EnhancedCreatorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contentId) return;

    const fetchCreatorInfo = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .rpc('get_enhanced_creator_info', { p_content_id: contentId });

        if (error) throw error;

        if (data && data.length > 0) {
          const info = data[0];
          setCreatorInfo({
            creator_type: info.creator_type as 'platform_user' | 'claimed_channel' | 'youtube_import',
            display_name: info.display_name,
            display_avatar: info.display_avatar,
            display_subscribers: info.display_subscribers,
            display_verified: info.display_verified,
            platform_bio: info.platform_bio,
            youtube_channel_id: info.youtube_channel_id
          });
        } else {
          setCreatorInfo(null);
        }
      } catch (err) {
        console.error('Error fetching enhanced creator info:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch creator info');
        setCreatorInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorInfo();
  }, [contentId]);

  return { creatorInfo, loading, error };
};