/**
 * Performance optimization utilities
 * Reduces main-thread blocking and improves Core Web Vitals
 */

// Debounce utility to reduce excessive function calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility to limit function execution frequency
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Lazy initialization helper
export function createLazyInitializer<T>(factory: () => T): () => T {
  let instance: T;
  let initialized = false;
  
  return () => {
    if (!initialized) {
      instance = factory();
      initialized = true;
    }
    return instance;
  };
}

// Optimized performance observer that only runs when needed
export function createOptimizedObserver(
  type: string,
  callback: (entries: PerformanceEntry[]) => void,
  options?: PerformanceObserverInit
) {
  // Only create observers in development or QA mode
  if (!import.meta.env.DEV && new URLSearchParams(window.location.search).get('qa') !== '1') {
    return { disconnect: () => {} };
  }
  
  if (!('PerformanceObserver' in window)) {
    return { disconnect: () => {} };
  }
  
  try {
    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries());
    });
    
    observer.observe({ type, ...options });
    return observer;
  } catch (error) {
    console.warn('Failed to create performance observer:', error);
    return { disconnect: () => {} };
  }
}