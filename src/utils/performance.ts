// Performance optimization utilities

// Console log suppression and performance monitoring
export const suppressConsoleLogs = () => {
  if (process.env.NODE_ENV === 'production') {
    // Store original console methods for emergency debugging
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      debug: console.debug,
    };

    // Replace with no-ops in production
    console.log = () => {};
    console.info = () => {};
    console.warn = () => {};
    console.debug = () => {};

    // Keep console.error for critical issues
    // Expose original methods for emergency debugging
    (window as any).__restoreConsole = () => {
      Object.assign(console, originalConsole);
    };
  }
};

// Enhanced debounce with immediate execution option
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  immediate = false
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let callNow = immediate;

  return (...args: Parameters<T>) => {
    const later = () => {
      timeoutId = null;
      if (!immediate) func(...args);
    };

    const shouldCallNow = callNow && !timeoutId;
    
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(later, delay);
    
    if (shouldCallNow) func(...args);
    callNow = false;
  };
};

// Enhanced throttle with leading and trailing options
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): ((...args: Parameters<T>) => void) => {
  const { leading = true, trailing = true } = options;
  let inThrottle = false;
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      if (leading) func(...args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      if (trailing) {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
          if (Date.now() - lastRan >= limit) {
            func(...args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    }
    
    setTimeout(() => inThrottle = false, limit);
  };
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
    const memory = (performance as any).memory;
    const memoryInfo = {
      used: Math.round(memory.usedJSHeapSize / 1048576),
      allocated: Math.round(memory.totalJSHeapSize / 1048576),
      limit: Math.round(memory.jsHeapSizeLimit / 1048576),
      usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
    };
    
    if (memoryInfo.usage > 80) {
      console.warn('High memory usage detected:', memoryInfo);
    }
    
    return memoryInfo;
  }
  return null;
};

// Request deduplication
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const promise = requestFn()
      .finally(() => {
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear() {
    this.pendingRequests.clear();
  }
}

// Enhanced cleanup manager with automatic resource tracking
export const createCleanupManager = () => {
  const cleanupTasks: (() => void)[] = [];
  const resources = {
    intervals: new Set<NodeJS.Timeout>(),
    timeouts: new Set<NodeJS.Timeout>(),
    eventListeners: new Set<{ element: EventTarget; event: string; handler: EventListener }>(),
    observers: new Set<{ observer: IntersectionObserver | ResizeObserver | MutationObserver }>()
  };

  const addInterval = (callback: () => void, ms: number) => {
    const interval = setInterval(callback, ms);
    resources.intervals.add(interval);
    return interval;
  };

  const addTimeout = (callback: () => void, ms: number) => {
    const timeout = setTimeout(callback, ms);
    resources.timeouts.add(timeout);
    return timeout;
  };

  const addEventListener = (element: EventTarget, event: string, handler: EventListener) => {
    element.addEventListener(event, handler);
    resources.eventListeners.add({ element, event, handler });
  };

  const addObserver = (observer: IntersectionObserver | ResizeObserver | MutationObserver) => {
    resources.observers.add({ observer });
    return observer;
  };

  const cleanup = () => {
    // Clear intervals
    resources.intervals.forEach(interval => clearInterval(interval));
    resources.intervals.clear();

    // Clear timeouts
    resources.timeouts.forEach(timeout => clearTimeout(timeout));
    resources.timeouts.clear();

    // Remove event listeners
    resources.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    resources.eventListeners.clear();

    // Disconnect observers
    resources.observers.forEach(({ observer }) => {
      observer.disconnect();
    });
    resources.observers.clear();

    // Run custom cleanup tasks
    cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    });
    cleanupTasks.length = 0;
  };

  return {
    addInterval,
    addTimeout,
    addEventListener,
    addObserver,
    addCleanup: (task: () => void) => cleanupTasks.push(task),
    cleanup,
    getResourceCount: () => ({
      intervals: resources.intervals.size,
      timeouts: resources.timeouts.size,
      eventListeners: resources.eventListeners.size,
      observers: resources.observers.size,
      customTasks: cleanupTasks.length
    })
  };
};

// Performance measurement utilities
export const measurePerformance = (name: string) => {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`);
      }
      return duration;
    }
  };
};

// Batch processor for database operations
export class BatchProcessor<T, R> {
  private queue: T[] = [];
  private processing = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    private options: {
      batchSize?: number;
      delay?: number;
      maxWait?: number;
    } = {}
  ) {
    this.options = {
      batchSize: 10,
      delay: 100,
      maxWait: 1000,
      ...options
    };
  }

  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...item, resolve, reject } as any);
      this.scheduleProcess();
    });
  }

  private scheduleProcess() {
    if (this.timer) clearTimeout(this.timer);
    
    // Process immediately if batch is full
    if (this.queue.length >= this.options.batchSize!) {
      this.process();
      return;
    }

    // Otherwise schedule with delay
    this.timer = setTimeout(() => this.process(), this.options.delay);
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const batch = this.queue.splice(0, this.options.batchSize);
    
    try {
      const results = await this.processor(batch);
      batch.forEach((item: any, index) => {
        if (results[index]) {
          item.resolve(results[index]);
        } else {
          item.reject(new Error('No result for item'));
        }
      });
    } catch (error) {
      batch.forEach((item: any) => item.reject(error));
    } finally {
      this.processing = false;
      
      // Process remaining items if any
      if (this.queue.length > 0) {
        this.scheduleProcess();
      }
    }
  }

  flush(): Promise<void> {
    return new Promise((resolve) => {
      if (this.queue.length === 0 && !this.processing) {
        resolve();
        return;
      }
      
      const checkComplete = () => {
        if (this.queue.length === 0 && !this.processing) {
          resolve();
        } else {
          setTimeout(checkComplete, 10);
        }
      };
      
      this.process();
      checkComplete();
    });
  }
}

// Rate limiter
export class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    return this.requests[0] + this.windowMs;
  }
}
