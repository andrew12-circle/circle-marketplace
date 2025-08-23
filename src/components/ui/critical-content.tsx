import React, { Suspense, memo } from 'react';

interface CriticalContentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Wrapper for above-the-fold content that should render immediately
export const CriticalContent = memo<CriticalContentProps>(({ 
  children, 
  fallback = <div className="h-96 animate-pulse bg-muted rounded-lg" /> 
}) => {
  return (
    <div className="critical-content" style={{ containIntrinsicSize: 'auto' }}>
      {children}
    </div>
  );
});

CriticalContent.displayName = 'CriticalContent';

// Lazy wrapper for non-critical content
export const NonCriticalContent = memo<CriticalContentProps>(({ 
  children, 
  fallback = <div className="h-64 animate-pulse bg-muted rounded-lg" /> 
}) => {
  return (
    <Suspense fallback={fallback}>
      <div className="non-critical-content" style={{ contentVisibility: 'auto' }}>
        {children}
      </div>
    </Suspense>
  );
});

NonCriticalContent.displayName = 'NonCriticalContent';

// Hook to prioritize critical resources
export const useCriticalResourceHints = () => {
  React.useEffect(() => {
    // Preload critical fonts
    const criticalFonts = [
      '/fonts/inter-var.woff2',
      '/fonts/inter-var-latin.woff2'
    ];
    
    criticalFonts.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      link.href = font;
      document.head.appendChild(link);
    });
  }, []);
};