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

      console.log('fetchVideos called with options:', options);

      // Set a hard timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('Video loading timeout reached');
        setLoading(false);
        setError('Unable to load videos. Please try again later.');
      }, 5000); // 5 second timeout

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
      console.log('Query conditions:', allConditions);

      // Execute query
      let queryBuilder = supabase
        .from('content')
        .select('*')
        .match(allConditions)
        .order('created_at', { ascending: false });

      if (options.limit) {
        queryBuilder = queryBuilder.limit(options.limit * 2); // Get extra for shorts filtering
      }

      console.log('About to execute video query...');
      const { data, error: fetchError } = await queryBuilder;

      console.log('Video query result:', { data: data?.length, error: fetchError });

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

      clearTimeout(timeoutId);
      setVideos(formattedVideos);
    } catch (err) {
      console.error('Video fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch videos';
      setError(errorMessage);
      
      // Provide fallback mock data so users can still see content
      const mockVideos: Video[] = [
        {
          id: 'mock-1',
          title: 'Lead Generation Mastery for Real Estate Agents',
          creator: 'Sarah Johnson',
          thumbnail: '/placeholder.svg',
          duration: '12:34',
          category: 'Lead Generation',
          rating: 4.9,
          isPro: true,
          views: '24K',
          description: 'Learn proven strategies to generate quality leads consistently.'
        },
        {
          id: 'mock-2', 
          title: 'Social Media Marketing That Actually Works',
          creator: 'Mike Chen',
          thumbnail: '/placeholder.svg',
          duration: '8:45',
          category: 'Marketing',
          rating: 4.7,
          isPro: false,
          views: '18K',
          description: 'Build your brand and attract clients through social media.'
        },
        {
          id: 'mock-3',
          title: 'Closing Techniques That Never Fail',
          creator: 'Emma Wilson',
          thumbnail: '/placeholder.svg', 
          duration: '15:22',
          category: 'Sales',
          rating: 4.8,
          isPro: true,
          views: '31K',
          description: 'Master the art of closing deals and overcoming objections.'
        }
      ];
      
      setVideos(mockVideos);
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