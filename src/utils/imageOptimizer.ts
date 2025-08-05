import { supabase } from '@/integrations/supabase/client';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export class ImageOptimizer {
  private static instance: ImageOptimizer;

  public static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  /**
   * Cache YouTube thumbnail for a video
   */
  async cacheYouTubeThumbnail(
    videoId: string,
    options: {
      videoTitle?: string;
      channelTitle?: string;
      contentId?: string;
    } = {}
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('cache-youtube-thumbnail', {
        body: {
          videoId,
          ...options
        }
      });

      if (error) {
        console.error('Error caching YouTube thumbnail:', error);
        return null;
      }

      return data.success ? data.cachedUrl : null;
    } catch (error) {
      console.error('Error calling cache-youtube-thumbnail function:', error);
      return null;
    }
  }

  /**
   * Process and cache any image URL
   */
  async processImage(
    imageUrl: string,
    imageType: 'thumbnail' | 'avatar' | 'cover' | 'content',
    options: {
      contentId?: string;
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    } = {}
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('process-image', {
        body: {
          imageUrl,
          imageType,
          maxWidth: options.maxWidth || 800,
          maxHeight: options.maxHeight || 600,
          quality: options.quality || 80,
          contentId: options.contentId
        }
      });

      if (error) {
        console.error('Error processing image:', error);
        return null;
      }

      return data.success ? data.cachedUrl : null;
    } catch (error) {
      console.error('Error calling process-image function:', error);
      return null;
    }
  }

  /**
   * Get cached image URL if available
   */
  async getCachedImage(
    originalUrl: string,
    imageType: 'thumbnail' | 'avatar' | 'cover' | 'content'
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('image_cache')
        .select('cached_url')
        .eq('original_url', originalUrl)
        .eq('image_type', imageType)
        .maybeSingle();

      if (error) {
        console.error('Error fetching cached image:', error);
        return null;
      }

      return data?.cached_url || null;
    } catch (error) {
      console.error('Error querying image cache:', error);
      return null;
    }
  }

  /**
   * Batch process multiple images
   */
  async batchProcessImages(
    images: Array<{
      url: string;
      type: 'thumbnail' | 'avatar' | 'cover' | 'content';
      contentId?: string;
    }>,
    options: ImageOptimizationOptions = {}
  ): Promise<Array<{ original: string; optimized: string | null }>> {
    const results = await Promise.allSettled(
      images.map(async (image) => {
        const optimized = await this.processImage(image.url, image.type, {
          contentId: image.contentId,
          ...options
        });
        return { original: image.url, optimized };
      })
    );

    return results.map((result, index) => ({
      original: images[index].url,
      optimized: result.status === 'fulfilled' ? result.value.optimized : null
    }));
  }

  /**
   * Clean up old cached images (utility method)
   */
  async cleanupOldCache(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      await supabase
        .from('image_cache')
        .delete()
        .lt('last_accessed', cutoffDate.toISOString());

      console.log(`Cleaned up image cache older than ${daysOld} days`);
    } catch (error) {
      console.error('Error cleaning up image cache:', error);
    }
  }

  /**
   * Generate default image for content type
   */
  getDefaultImageUrl(imageType: 'thumbnail' | 'avatar' | 'cover' | 'content'): string {
    const baseUrl = 'https://ihzyuyfawapweamqzzlj.supabase.co/storage/v1/object/public/default-images';
    
    switch (imageType) {
      case 'thumbnail':
        return `${baseUrl}/default-thumbnail.webp`;
      case 'avatar':
        return `${baseUrl}/default-avatar.webp`;
      case 'cover':
        return `${baseUrl}/default-cover.webp`;
      case 'content':
        return `${baseUrl}/default-content.webp`;
      default:
        return '/placeholder.svg';
    }
  }
}

// Export singleton instance
export const imageOptimizer = ImageOptimizer.getInstance();