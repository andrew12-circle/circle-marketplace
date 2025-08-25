// First Input Delay optimization utilities
import React from 'react';
import { taskScheduler } from './taskScheduler';

/**
 * Break up component initialization to prevent blocking
 */
export const deferComponentInitialization = (initFn: () => void, priority: 'high' | 'low' = 'low') => {
  if (priority === 'high') {
    // For critical components, defer minimally
    setTimeout(() => taskScheduler.schedule(initFn), 0);
  } else {
    // For non-critical components, defer longer
    taskScheduler.schedule(initFn);
  }
};

/**
 * Optimize heavy useEffect operations
 */
export const createOptimizedEffect = (effect: () => void | (() => void), deps?: React.DependencyList) => {
  return () => {
    taskScheduler.schedule(() => {
      const cleanup = effect();
      if (cleanup && typeof cleanup === 'function') {
        return cleanup;
      }
    });
  };
};

/**
 * Break up large state updates
 */
export const scheduleStateUpdate = <T>(setState: React.Dispatch<React.SetStateAction<T>>, newState: T) => {
  taskScheduler.schedule(() => {
    setState(newState);
  });
};

/**
 * Defer non-critical operations until after initial paint
 */
export const deferUntilIdle = (operation: () => void) => {
  if (typeof window === 'undefined') return;
  
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(operation, { timeout: 1000 });
  } else {
    setTimeout(operation, 100);
  }
};

/**
 * Optimize event handler registration to prevent blocking
 */
export const createDeferredEventHandler = (handler: (...args: any[]) => void) => {
  return (...args: any[]) => {
    taskScheduler.schedule(() => handler(...args));
  };
};

/**
 * Initialize app components in priority order
 */
export const initializeAppWithPriority = () => {
  if (typeof window === 'undefined') return;
  
  // Critical: Allow immediate input responsiveness
  taskScheduler.schedule(() => {
    // Enable basic interactions first
    document.body.style.pointerEvents = 'auto';
  });

  // High priority: Core UI components
  taskScheduler.schedule(() => {
    // Navigation and critical UI
  });

  // Medium priority: Secondary features
  taskScheduler.schedule(() => {
    // Search, filters, etc.
  });

  // Low priority: Analytics, metrics, etc.
  deferUntilIdle(() => {
    // Non-critical tracking
  });
};