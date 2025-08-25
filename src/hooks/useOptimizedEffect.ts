import React from 'react';
import { taskScheduler } from '@/utils/taskScheduler';

/**
 * Safe hook for optimized effects that defer execution to prevent blocking
 */
export const useOptimizedEffect = (
  effect: () => void | (() => void), 
  deps?: React.DependencyList,
  priority: 'high' | 'normal' | 'low' = 'normal'
) => {
  const cleanupRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    // Clear any previous cleanup
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    const executeEffect = () => {
      const cleanup = effect();
      if (cleanup && typeof cleanup === 'function') {
        cleanupRef.current = cleanup;
      }
    };

    // Schedule based on priority
    switch (priority) {
      case 'high':
        setTimeout(() => taskScheduler.schedule(executeEffect), 0);
        break;
      case 'normal':
        taskScheduler.schedule(executeEffect);
        break;
      case 'low':
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as any).requestIdleCallback(executeEffect, { timeout: 1000 });
        } else {
          setTimeout(executeEffect, 100);
        }
        break;
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, deps);
};