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
    window.requestIdleCallback(() => {
      // Preload critical chunks
      const criticalChunks = [
        '/assets/react-core-',
        '/assets/router-',
        '/assets/utils-'
      ];
      
      criticalChunks.forEach(chunk => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'script';
        link.href = chunk;
        document.head.appendChild(link);
      });
    });
  }
};

// Initialize performance optimizations
export const initPerformanceOptimizations = () => {
  if (typeof window !== 'undefined') {
    // Run optimizations after page load
    window.addEventListener('load', () => {
      deferNonCriticalScripts();
      optimizeScriptLoading();
    });
  }
};