import { initCSSOptimizations } from './cssOptimizer';
import { taskScheduler } from './taskScheduler';
import { initDOMOptimizations } from './domOptimizer';

// Performance optimization utilities
export const deferNonCriticalScripts = () => {
  // Defer non-critical JavaScript execution
  if (typeof window !== 'undefined') {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Load deferred content when it comes into view
          const element = entry.target;
          if (element.hasAttribute('data-defer-src')) {
            const script = document.createElement('script');
            script.src = element.getAttribute('data-defer-src')!;
            script.async = true;
            document.head.appendChild(script);
            observer.unobserve(element);
          }
        }
      });
    });

    // Observe elements marked for deferred loading
    document.querySelectorAll('[data-defer-src]').forEach((el) => {
      observer.observe(el);
    });
  }
};

export const optimizeScriptLoading = () => {
  // Use requestIdleCallback for non-critical operations
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      // Schedule preloading of critical chunks using task scheduler
      const criticalChunks = [
        '/assets/react-core-',
        '/assets/router-',
        '/assets/utils-'
      ];
      
      // Process chunks in small batches to avoid blocking
      criticalChunks.forEach((chunk, index) => {
        taskScheduler.schedule(() => {
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.as = 'script';
          link.href = chunk;
          document.head.appendChild(link);
        });
      });
    });
  }
};

// Break up initialization into smaller tasks
export const initializeInChunks = () => {
  if (typeof window === 'undefined') return;
  
  // Break up heavy initialization work
  const initTasks = [
    () => initCSSOptimizations(),
    () => initDOMOptimizations(),
    () => deferNonCriticalScripts(),
    () => optimizeScriptLoading(),
  ];
  
  // Schedule each task separately to avoid blocking
  initTasks.forEach(task => {
    taskScheduler.schedule(task);
  });
};

// Initialize performance optimizations with time-slicing
export const initPerformanceOptimizations = () => {
  if (typeof window !== 'undefined') {
    // Use task scheduler to avoid blocking main thread
    taskScheduler.schedule(() => {
      initializeInChunks();
    });
  }
};