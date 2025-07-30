import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Podcast {
  id: string;
  title: string;
  creator: string;
  description: string;
  thumbnail: string;
  duration: string;
  episodeNumber?: number;
  seasonNumber?: number;
  releaseDate: string;
  category: string;
  rating?: number;
  isPlaying?: boolean;
  isPro?: boolean;
  tags?: string[];
  content_url?: string;
  cover_image_url?: string;
  created_at?: string;
  updated_at?: string;
  creator_id?: string;
  is_featured?: boolean;
  total_plays?: number;
}

interface UsePodcastsOptions {
  featured?: boolean;
  category?: string;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export const usePodcasts = (options: UsePodcastsOptions = {}) => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    featured,
    category,
    limit,
    orderBy = 'created_at',
    orderDirection = 'desc'
  } = options;

  useEffect(() => {
    fetchPodcasts();
  }, [featured, category, limit, orderBy, orderDirection]);

  const fetchPodcasts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('content')
        .select(`
          id,
          title,
          description,
          category,
          duration,
          cover_image_url,
          content_url,
          tags,
          creator_id,
          is_featured,
          is_pro,
          rating,
          total_plays,
          created_at,
          updated_at,
          published_at,
          metadata
        `)
        .eq('content_type', 'podcast')
        .eq('is_published', true);

      // Apply filters
      if (featured) {
        query = query.eq('is_featured', true);
      }

      if (category) {
        query = query.eq('category', category);
      }

      // Apply ordering
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transform data to match Podcast interface
      const transformedPodcasts: Podcast[] = (data || []).map(item => {
        // Safely parse metadata
        const metadata = item.metadata as any || {};
        
        return {
          id: item.id,
          title: item.title,
          creator: metadata.creator || 'Unknown Creator',
          description: item.description || '',
          thumbnail: item.cover_image_url || '/placeholder.svg',
          duration: item.duration || '0:00',
          episodeNumber: metadata.episodeNumber,
          seasonNumber: metadata.seasonNumber,
          releaseDate: item.published_at || item.created_at,
          category: item.category,
          rating: item.rating || undefined,
          isPro: item.is_pro || false,
          tags: item.tags || [],
          content_url: item.content_url,
          cover_image_url: item.cover_image_url,
          created_at: item.created_at,
          updated_at: item.updated_at,
          creator_id: item.creator_id,
          is_featured: item.is_featured,
          total_plays: item.total_plays
        };
      });

      setPodcasts(transformedPodcasts);
      setError(null);
    } catch (err) {
      console.error('Error fetching podcasts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch podcasts');
      setPodcasts([]);
    } finally {
      setLoading(false);
    }
  };

  const incrementPlay = async (podcastId: string) => {
    try {
      const { error } = await supabase.rpc('increment_content_plays', {
        content_uuid: podcastId
      });

      if (error) {
        console.error('Error incrementing podcast play count:', error);
      }
    } catch (err) {
      console.error('Error incrementing podcast play count:', err);
    }
  };

  return {
    podcasts,
    loading,
    error,
    refetch: fetchPodcasts,
    incrementPlay
  };
};