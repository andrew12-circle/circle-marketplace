import React from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  sizes?: string;
  priority?: boolean;
  style?: React.CSSProperties;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  width,
  height,
  sizes = "100vw",
  priority = false,
  style,
  ...props
}) => {
  // Generate WebP and fallback versions
  const webpSrc = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const fallbackSrc = src;

  // Ensure explicit dimensions for LCP optimization
  const imgStyle = {
    ...style,
    width: width || '100%',
    height: height || 'auto',
    aspectRatio: width && height ? `${width}/${height}` : undefined
  };

  return (
    <picture>
      {/* WebP source for modern browsers */}
      <source srcSet={webpSrc} type="image/webp" />
      
      {/* Fallback for older browsers */}
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        width={width}
        height={height}
        style={imgStyle}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...props}
      />
    </picture>
  );
};

interface ResponsiveLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}

export const ResponsiveLogo: React.FC<ResponsiveLogoProps> = ({
  className = "h-8 w-8",
  width,
  height,
  style,
}) => {
  return (
    <div className={className} style={style}>
      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
        C
      </div>
    </div>
  );
};