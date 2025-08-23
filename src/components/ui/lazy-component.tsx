import React, { memo, useMemo, useCallback } from 'react';

interface LazyComponentProps {
  children: React.ReactNode;
  threshold?: string;
  delay?: number;
}

export const LazyComponent = memo<LazyComponentProps>(({ 
  children, 
  threshold = '100px',
  delay = 0 
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasRendered, setHasRendered] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRendered) {
          if (delay > 0) {
            setTimeout(() => {
              setIsVisible(true);
              setHasRendered(true);
            }, delay);
          } else {
            setIsVisible(true);
            setHasRendered(true);
          }
        }
      },
      {
        rootMargin: threshold,
        threshold: 0.1
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, delay, hasRendered]);

  return (
    <div ref={ref}>
      {(isVisible || hasRendered) ? children : null}
    </div>
  );
});

LazyComponent.displayName = 'LazyComponent';

export const useLazyList = <T,>(
  items: T[],
  initialCount: number = 10,
  increment: number = 10
) => {
  const [visibleCount, setVisibleCount] = React.useState(initialCount);
  
  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  );
  
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + increment, items.length));
  }, [increment, items.length]);
  
  const hasMore = visibleCount < items.length;
  
  return {
    visibleItems,
    loadMore,
    hasMore,
    visibleCount,
    totalCount: items.length
  };
};