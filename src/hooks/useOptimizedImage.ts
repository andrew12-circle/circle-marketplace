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
  const [optimizedUrl, setOptimizedUrl] = useState<string>(fallbackUrl);
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

    const processImage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check cache first
        const { data: cachedImage } = await supabase
          .from('image_cache')
          .select('cached_url')
          .eq('original_url', imageUrl)
          .eq('image_type', imageType)
          .maybeSingle();

        if (cachedImage) {
          setOptimizedUrl(cachedImage.cached_url);
          setIsFromCache(true);
          
          // Update last accessed
          await supabase
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

        if (data.success) {
          setOptimizedUrl(data.cachedUrl);
          setIsFromCache(data.fromCache || false);
        } else {
          throw new Error(data.error || 'Failed to process image');
        }

      } catch (err) {
        console.error('Error optimizing image:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setOptimizedUrl(fallbackUrl);
      } finally {
        setIsLoading(false);
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