// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Video {
  id: string;
  title: string;
  creator: string;
  thumbnail: string;
  duration: string;
  category: string;
  rating?: number;
  isPro?: boolean;
  views?: string;
  description?: string;
}

interface UseVideosOptions {
  category?: string;
  featured?: boolean;
  limit?: number;
}

export const useVideos = (options: UseVideosOptions = {}) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query conditions
      const baseConditions = {
        content_type: 'video',
        is_published: true
      };

      let additionalConditions = {};
      
      if (options.category === 'shorts') {
        // For shorts, we'll filter in JavaScript since metadata queries are complex
        additionalConditions = {};
      } else if (options.category) {
        additionalConditions = { category: options.category };
      }

      if (options.featured !== undefined) {
        additionalConditions = { ...additionalConditions, is_featured: options.featured };
      }

      const allConditions = { ...baseConditions, ...additionalConditions };

      // Execute query
      let queryBuilder = supabase
        .from('content')
        .select('*')
        .match(allConditions)
        .order('created_at', { ascending: false });

      if (options.limit) {
        queryBuilder = queryBuilder.limit(options.limit * 2); // Get extra for shorts filtering
      }

      const { data, error: fetchError } = await queryBuilder;

      if (fetchError) {
        throw fetchError;
      }

      // Filter for shorts in JavaScript if needed
      let filteredData = data || [];
      if (options.category === 'shorts') {
        filteredData = filteredData.filter(video => {
          // Check if metadata exists and has is_short property
          if (video.metadata && typeof video.metadata === 'object' && !Array.isArray(video.metadata)) {
            return (video.metadata as any).is_short === true;
          }
          return false;
        });
      }

      // Apply limit after filtering
      if (options.limit) {
        filteredData = filteredData.slice(0, options.limit);
      }

      if (fetchError) {
        throw fetchError;
      }

      const formattedVideos: Video[] = filteredData.map((video) => ({
        id: video.id,
        title: video.title,
        creator: "Content Creator", // Will need to join with profiles table later
        thumbnail: video.cover_image_url || "/placeholder.svg",
        duration: video.duration || "0:00",
        category: video.category,
        rating: video.rating || undefined,
        isPro: video.is_pro,
        views: video.total_plays > 0 ? `${Math.floor(video.total_plays / 1000)}K` : "0",
        description: video.description || undefined,
      }));

      setVideos(formattedVideos);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch videos';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const incrementView = async (videoId: string) => {
    try {
      const { error } = await supabase.rpc('increment_content_plays', {
        content_uuid: videoId
      });

      if (error) {
        console.error('Failed to increment view:', error);
      }
    } catch (err) {
      console.error('Failed to increment view:', err);
    }
  };

  const rateVideo = async (videoId: string, rating: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to rate videos",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('content_ratings')
        .upsert({
          content_id: videoId,
          user_id: user.id,
          rating: rating
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!",
      });

      // Refresh videos to get updated rating
      fetchVideos();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit rating';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [options.category, options.featured, options.limit]);

  return {
    videos,
    loading,
    error,
    refetch: fetchVideos,
    incrementView,
    rateVideo,
  };
};