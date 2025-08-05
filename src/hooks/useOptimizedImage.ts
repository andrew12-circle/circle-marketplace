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
  // Start with original image URL for instant display
  const [optimizedUrl, setOptimizedUrl] = useState<string>(imageUrl || fallbackUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    if (!imageUrl || imageUrl === fallbackUrl) {
      setOptimizedUrl(fallbackUrl);
      return;
    }

    // Always start with the original URL for instant display
    setOptimizedUrl(imageUrl);

    // If it's already a Supabase Storage URL, no need to optimize
    if (imageUrl.includes('supabase.co/storage/') || imageUrl.includes('ihzyuyfawapweamqzzlj.supabase.co')) {
      return;
    }

    const processImage = async () => {
      // Don't show loading since we already display the original image
      setError(null);

      try {
        // Check cache first - this is fast for pro users with pre-cached images
        const { data: cachedImage } = await supabase
          .from('image_cache')
          .select('cached_url')
          .eq('original_url', imageUrl)
          .eq('image_type', imageType)
          .maybeSingle();

        if (cachedImage) {
          setOptimizedUrl(cachedImage.cached_url);
          setIsFromCache(true);
          
          // Update last accessed in background
          supabase
            .from('image_cache')
            .update({ last_accessed: new Date().toISOString() })
            .eq('original_url', imageUrl)
            .eq('image_type', imageType)
            .then(() => {});
          
          return;
        }

        // Only process if user is authenticated (avoid errors for non-auth users)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Keep original URL for non-authenticated users
          return;
        }

        // Process image through edge function for authenticated users
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
          console.warn('Image optimization failed:', functionError.message);
          return; // Keep original URL
        }

        if (data?.success) {
          setOptimizedUrl(data.cachedUrl);
          setIsFromCache(data.fromCache || false);
        }

      } catch (err) {
        console.warn('Error optimizing image:', err);
        // Keep original URL on error instead of fallback
      }
    };

    processImage();
  }, [imageUrl, imageType, contentId, fallbackUrl, maxWidth, maxHeight]);

  return {
    optimizedUrl,
    isLoading,
    error,
    isFromCache
  };
};