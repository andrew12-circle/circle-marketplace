// CSS loading optimization utilities
export const optimizeCSSLoading = () => {
  if (typeof window === 'undefined') return;

  // Function to load CSS non-blocking
  function loadCSS(href: string, media = 'all') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.media = media;
    
    // Add to head
    document.head.appendChild(link);
    
    return link;
  }

  // Load non-critical CSS after critical path
  function loadNonCriticalCSS() {
    const stylesheets = [
      // Add any additional non-critical stylesheets here
    ];
    
    stylesheets.forEach(href => {
      loadCSS(href);
    });
  }

  // Use requestIdleCallback if available, otherwise use timeout
  const win = window as any;
  if ('requestIdleCallback' in win) {
    win.requestIdleCallback(loadNonCriticalCSS);
  } else {
    setTimeout(loadNonCriticalCSS, 100);
  }
};

// Initialize CSS optimization
export const initCSSOptimizations = () => {
  if (typeof window !== 'undefined') {
    // Run after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', optimizeCSSLoading);
    } else {
      optimizeCSSLoading();
    }
  }
};