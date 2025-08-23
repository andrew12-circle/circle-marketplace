// Main-thread work optimization utilities
import React from 'react';
import { taskScheduler } from './taskScheduler';

/**
 * Break up heavy script evaluation work
 */
export class MainThreadOptimizer {
  private initQueue: Array<() => void> = [];
  private isProcessing = false;

  // Add initialization work to be processed in chunks
  queueInit(initFn: () => void) {
    this.initQueue.push(initFn);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Process initialization queue in small chunks to prevent blocking
  private processQueue() {
    this.isProcessing = true;
    
    const processChunk = () => {
      const start = performance.now();
      
      // Process for maximum 2ms to prevent main thread blocking
      while (this.initQueue.length > 0 && (performance.now() - start) < 2) {
        const initFn = this.initQueue.shift();
        if (initFn) {
          try {
            initFn();
          } catch (error) {
            console.warn('Main thread optimizer error:', error);
          }
        }
      }
      
      if (this.initQueue.length > 0) {
        // Yield to main thread before continuing
        setTimeout(processChunk, 0);
      } else {
        this.isProcessing = false;
      }
    };
    
    processChunk();
  }

  // Break up component registration
  registerComponent(componentInit: () => void) {
    this.queueInit(componentInit);
  }

  // Defer heavy computations
  deferComputation<T>(computation: () => T): Promise<T> {
    return new Promise((resolve) => {
      this.queueInit(() => {
        const result = computation();
        resolve(result);
      });
    });
  }
}

export const mainThreadOptimizer = new MainThreadOptimizer();

/**
 * Optimize React component initialization
 */
export const createOptimizedComponent = <T extends React.ComponentType<any>>(
  component: T,
  priority: 'critical' | 'normal' | 'low' = 'normal'
): T => {
  const WrappedComponent = (props: React.ComponentProps<T>) => {
    const [isReady, setIsReady] = React.useState(priority === 'critical');
    
    React.useEffect(() => {
      if (!isReady) {
        const delay = priority === 'low' ? 100 : 50;
        setTimeout(() => {
          mainThreadOptimizer.queueInit(() => {
            setIsReady(true);
          });
        }, delay);
      }
    }, [isReady]);

    if (!isReady) {
      return null; // Or a lightweight placeholder
    }

    return React.createElement(component, props);
  };

  return WrappedComponent as T;
};

/**
 * Break up large object/array processing
 */
export const processInBatches = async <T, R>(
  items: T[],
  processor: (item: T) => R,
  batchSize = 5
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    await new Promise<void>((resolve) => {
      mainThreadOptimizer.queueInit(() => {
        const batchResults = batch.map(processor);
        results.push(...batchResults);
        resolve();
      });
    });
  }
  
  return results;
};

/**
 * Optimize heavy event handler setup
 */
export const deferEventHandlers = (setupFn: () => (() => void) | void) => {
  let cleanup: (() => void) | void;
  
  mainThreadOptimizer.queueInit(() => {
    cleanup = setupFn();
  });
  
  return () => {
    if (cleanup && typeof cleanup === 'function') {
      cleanup();
    }
  };
};

/**
 * Optimize script evaluation by deferring imports
 */
export const deferModuleInit = async (moduleInit: () => Promise<any>) => {
  return new Promise((resolve) => {
    mainThreadOptimizer.queueInit(async () => {
      try {
        const module = await moduleInit();
        resolve(module);
      } catch (error) {
        console.warn('Deferred module init failed:', error);
        resolve(null);
      }
    });
  });
};