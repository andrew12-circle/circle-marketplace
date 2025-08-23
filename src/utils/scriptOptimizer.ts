// Script evaluation optimization utilities
import React from 'react';
import { mainThreadOptimizer } from './mainThreadOptimizer';

/**
 * Break up large React component trees to reduce script evaluation time
 */
export const createLazyComponent = <T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  fallback: React.ComponentType = () => null
) => {
  const LazyComponent = React.lazy(() => {
    // Defer the import to reduce initial script evaluation
    return new Promise<{ default: T }>((resolve) => {
      mainThreadOptimizer.queueInit(async () => {
        try {
          const module = await factory();
          resolve(module);
        } catch (error) {
          console.warn('Lazy component loading failed:', error);
          resolve({ default: fallback as T });
        }
      });
    });
  });

  return LazyComponent;
};

/**
 * Optimize heavy computation by breaking into smaller tasks
 */
export const optimizeComputation = async <T>(
  computation: () => T,
  maxExecutionTime = 3
): Promise<T> => {
  return new Promise((resolve, reject) => {
    mainThreadOptimizer.queueInit(() => {
      const start = performance.now();
      try {
        const result = computation();
        const duration = performance.now() - start;
        
        if (duration > maxExecutionTime) {
          console.warn(`Computation took ${duration}ms, consider breaking it up further`);
        }
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  });
};

/**
 * Reduce garbage collection pressure by deferring object creation
 */
export const deferObjectCreation = <T>(factory: () => T): Promise<T> => {
  return new Promise((resolve) => {
    mainThreadOptimizer.queueInit(() => {
      resolve(factory());
    });
  });
};

/**
 * Optimize React context providers to reduce script evaluation
 */
export const createOptimizedProvider = <T>(
  ProviderComponent: React.ComponentType<{ children: React.ReactNode; value: T }>,
  valueFactory: () => T
) => {
  return ({ children }: { children: React.ReactNode }) => {
    const [value, setValue] = React.useState<T | null>(null);
    
    React.useEffect(() => {
      mainThreadOptimizer.queueInit(() => {
        setValue(valueFactory());
      });
    }, []);
    
    if (value === null) {
      return React.createElement(React.Fragment, {}, children);
    }
    
    return React.createElement(ProviderComponent, { value, children });
  };
};

/**
 * Break up route registration to reduce initial script evaluation
 */
export const optimizeRouteRegistration = (routes: Array<{ path: string; component: React.ComponentType }>) => {
  const [registeredRoutes, setRegisteredRoutes] = React.useState<Array<{ path: string; component: React.ComponentType }>>([]);
  
  React.useEffect(() => {
    // Register routes in batches to prevent blocking
    const batchSize = 3;
    let currentIndex = 0;
    
    const registerBatch = () => {
      const batch = routes.slice(currentIndex, currentIndex + batchSize);
      if (batch.length > 0) {
        mainThreadOptimizer.queueInit(() => {
          setRegisteredRoutes(prev => [...prev, ...batch]);
          currentIndex += batchSize;
          
          if (currentIndex < routes.length) {
            setTimeout(registerBatch, 10);
          }
        });
      }
    };
    
    registerBatch();
  }, []);
  
  return registeredRoutes;
};