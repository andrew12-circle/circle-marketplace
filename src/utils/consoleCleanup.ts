// Global console cleanup - import this early in your app
import { suppressConsoleLogs } from '@/utils/performance';

// Apply console suppression immediately for production builds
suppressConsoleLogs();

// Remove all console statements from critical components
const cleanConsoleStatements = () => {
  // This utility function helps identify and remove console statements
  // during build time optimizations
  
  if (process.env.NODE_ENV === 'production') {
    // Override console methods with no-ops for performance
    const noop = () => {};
    
    ['log', 'info', 'warn', 'debug', 'trace'].forEach(method => {
      (console as any)[method] = noop;
    });
    
    // Keep error for critical issues
    const originalError = console.error;
    console.error = (...args: any[]) => {
      // Rate limit error logs to prevent spam
      if (Math.random() < 0.1) { // Only log 10% of errors in production
        originalError(...args);
      }
    };
  }
};

// Call immediately
cleanConsoleStatements();

// Performance monitoring and cleanup
export const initializePerformanceOptimizations = () => {
  // Clean up old event listeners
  const cleanupEventListeners = () => {
    // Remove any global event listeners that might be leaking
    const events = ['resize', 'scroll', 'click', 'mousemove'];
    events.forEach(event => {
      const listeners = (window as any)._eventListeners?.[event] || [];
      listeners.forEach((listener: EventListener) => {
        window.removeEventListener(event, listener);
      });
    });
  };

  // Memory cleanup on page visibility change
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Page is hidden, clean up resources
      cleanupEventListeners();
      
      // Force garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    cleanupEventListeners();
  });

  // Monitor memory usage in development
  if (process.env.NODE_ENV === 'development') {
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1048576),
          total: Math.round(memory.totalJSHeapSize / 1048576),
          limit: Math.round(memory.jsHeapSizeLimit / 1048576)
        };
        
        if (memoryUsage.used > 50) { // Alert if over 50MB
          console.warn('High memory usage detected:', memoryUsage);
        }
      }
    };

    // Check memory every 30 seconds in development
    const memoryInterval = setInterval(monitorMemory, 30000);
    
    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      clearInterval(memoryInterval);
    });
  }
};

export default initializePerformanceOptimizations;
