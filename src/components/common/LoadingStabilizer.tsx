import React, { memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStabilizerProps {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Memoized component to prevent unnecessary re-renders during loading states
export const LoadingStabilizer = memo<LoadingStabilizerProps>(({ 
  loading, 
  children, 
  fallback 
}) => {
  if (loading) {
    return fallback || (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <>{children}</>;
});