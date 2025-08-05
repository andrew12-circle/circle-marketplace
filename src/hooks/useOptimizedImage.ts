import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseOptimizedImageOptions {
  imageUrl: string;
  imageType: 'thumbnail' | 'avatar' | 'cover' | 'content';
  contentId?: string;
  fallbackUrl?: string;
  maxWidth?: number;
  maxHeight?: number;
}

interface UseOptimizedImageReturn {
  optimizedUrl: string;
  isLoading: boolean;
  error: string | null;
  isFromCache: boolean;
}

export const useOptimizedImage = ({
  imageUrl,
  imageType,
  contentId,
  fallbackUrl = '/placeholder.svg',
  maxWidth = 800,
  maxHeight = 600
}: UseOptimizedImageOptions): UseOptimizedImageReturn => {
  const [optimizedUrl, setOptimizedUrl] = useState<string>(imageUrl); // Start with original URL
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    if (!imageUrl || imageUrl === fallbackUrl) {
      setOptimizedUrl(fallbackUrl);
      return;
    }

    // If it's already a Supabase Storage URL, use it directly
    if (imageUrl.includes('supabase.co/storage/') || imageUrl.includes('ihzyuyfawapweamqzzlj.supabase.co')) {
      setOptimizedUrl(imageUrl);
      return;
    }

    // Set original URL immediately for fast display
    setOptimizedUrl(imageUrl);

    const processImage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check cache first
        const { data: cachedImage, error: cacheError } = await supabase
          .from('image_cache')
          .select('cached_url')
          .eq('original_url', imageUrl)
          .eq('image_type', imageType)
          .maybeSingle();

        if (cachedImage && !cacheError) {
          setOptimizedUrl(cachedImage.cached_url);
          setIsFromCache(true);
          
          // Update last accessed in background
          supabase
            .from('image_cache')
            .update({ last_accessed: new Date().toISOString() })
            .eq('original_url', imageUrl)
            .eq('image_type', imageType);
          
          return;
        }

        // Process image through edge function
        const { data, error: functionError } = await supabase.functions.invoke('process-image', {
          body: {
            imageUrl,
            imageType,
            contentId,
            maxWidth,
            maxHeight
          }
        });

        if (functionError) {
          throw new Error(functionError.message);
        }

        if (data && data.success) {
          setOptimizedUrl(data.cachedUrl);
          setIsFromCache(data.fromCache || false);
        } else {
          // Keep original URL if optimization fails
          console.warn('Image optimization failed, using original URL:', data?.error);
        }

      } catch (err) {
        console.warn('Image optimization failed, using original URL:', err);
        setError(err instanceof Error ? err.message : 'Optimization failed');
        // Keep original URL instead of fallback
      } finally {
        setIsLoading(false);
      }
    };

    // Start optimization in background
    processImage();
  }, [imageUrl, imageType, contentId, fallbackUrl, maxWidth, maxHeight]);

  return {
    optimizedUrl,
    isLoading,
    error,
    isFromCache
  };
};