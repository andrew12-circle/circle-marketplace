import { useState, useEffect, useMemo } from 'react';
import { cacheManager } from '@/utils/cacheManager';
import { supabase } from '@/integrations/supabase/client';

interface UseOptimizedVideosOptions {
  featured?: boolean;
  limit?: number;
  category?: string;
}

export const useOptimizedVideos = (options: UseOptimizedVideosOptions = {}) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const cacheKey = useMemo(() => {
    return `videos-${JSON.stringify(options)}`;
  }, [options]);

  useEffect(() => {
    const loadVideos = async () => {
      // Check cache first
      const cachedData = cacheManager.get(cacheKey);
      if (cachedData) {
        setVideos(cachedData);
        return;
      }

      setLoading(true);
      try {
        let query = supabase.from('content').select('*').eq('content_type', 'video');
        
        if (options.featured) {
          query = query.eq('is_featured', true);
        }
        
        if (options.category) {
          query = query.eq('category', options.category);
        }
        
        if (options.limit) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;
        
        if (!error && data) {
          setVideos(data);
          cacheManager.set(cacheKey, data);
        }
      } catch (error) {
        console.error('Error loading videos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [cacheKey, options]);

  const incrementView = async (videoId: string) => {
    try {
      // Simple increment without SQL function
      const { data: current } = await supabase
        .from('content')
        .select('total_plays')
        .eq('id', videoId)
        .single();
      
      if (current) {
        await supabase
          .from('content')
          .update({ total_plays: (current.total_plays || 0) + 1 })
          .eq('id', videoId);
      }
    } catch (error) {
      console.error('Error incrementing view:', error);
    }
  };

  return { videos, loading, incrementView };
};