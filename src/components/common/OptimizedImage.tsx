import React, { useState } from 'react';
import { useOptimizedImage } from '@/hooks/useOptimizedImage';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  imageType: 'thumbnail' | 'avatar' | 'cover' | 'content';
  contentId?: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  imageType,
  contentId,
  className,
  width = 800,
  height = 600,
  fallbackSrc = '/placeholder.svg',
  loading = 'lazy',
  onLoad,
  onError
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const { optimizedUrl, isLoading: isOptimizing, error: optimizationError } = useOptimizedImage({
    imageUrl: src,
    imageType,
    contentId,
    fallbackUrl: fallbackSrc,
    maxWidth: width,
    maxHeight: height
  });

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  // Show skeleton while optimizing or loading
  if (isOptimizing || (!imageLoaded && !imageError)) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        <Skeleton className="w-full h-full absolute inset-0" />
        {!isOptimizing && (
          <img
            src={optimizedUrl}
            alt={alt}
            className={cn('w-full h-full object-cover opacity-0', className)}
            loading={loading}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </div>
    );
  }

  // Show fallback if there's an error
  if (imageError || optimizationError) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={cn('w-full h-full object-cover', className)}
        loading={loading}
      />
    );
  }

  return (
    <img
      src={optimizedUrl}
      alt={alt}
      className={cn('w-full h-full object-cover transition-opacity duration-300', className)}
      loading={loading}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
};