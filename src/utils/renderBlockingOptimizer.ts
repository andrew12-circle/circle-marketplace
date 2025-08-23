// Render blocking optimization utilities
export const eliminateRenderBlocking = () => {
  if (typeof window === 'undefined') return;

  // Ensure all CSS is loaded asynchronously
  const optimizeCSS = () => {
    // Find any potentially blocking stylesheets
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]:not([media])') as NodeListOf<HTMLLinkElement>;
    
    stylesheets.forEach(link => {
      // Make non-critical stylesheets non-blocking
      if (link.href && !link.href.includes('critical')) {
        link.media = 'print';
        link.onload = function(this: HTMLLinkElement) {
          this.media = 'all';
          this.onload = null;
        };
      }
    });
  };

  // Load critical resources with proper prioritization
  const prioritizeResources = () => {
    // Ensure critical images have high priority
    const criticalImages = document.querySelectorAll('img[fetchpriority="high"]') as NodeListOf<HTMLImageElement>;
    criticalImages.forEach(img => {
      img.loading = 'eager';
    });

    // Defer non-critical scripts
    const nonCriticalScripts = document.querySelectorAll('script[src]:not([fetchpriority="high"])') as NodeListOf<HTMLScriptElement>;
    nonCriticalScripts.forEach(script => {
      if (!script.defer && !script.async) {
        script.defer = true;
      }
    });
  };

  // Apply optimizations immediately
  optimizeCSS();
  prioritizeResources();

  // Apply additional optimizations when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      optimizeCSS();
      prioritizeResources();
    });
  }
};

// Critical path optimization
export const optimizeCriticalPath = () => {
  if (typeof window === 'undefined') return;

  // Inline critical CSS if not already done
  const ensureCriticalCSS = () => {
    if (!document.querySelector('#critical-css')) {
      const style = document.createElement('style');
      style.id = 'critical-css';
      style.textContent = `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
        .hero-content { text-align: center; padding: 4rem 0; }
        .marketplace-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .service-card { background: white; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .text-3xl { font-size: 1.875rem; font-weight: 800; }
        .text-gray-600 { color: #6b7280; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-12 { margin-bottom: 3rem; }
        .font-bold { font-weight: 700; }
        .max-w-2xl { max-width: 42rem; }
        .text-sm { font-size: 0.875rem; }
      `;
      document.head.insertBefore(style, document.head.firstChild);
    }
  };

  // Remove render blocking resources
  const removeRenderBlocking = () => {
    // Convert blocking stylesheets to non-blocking
    const blockingCSS = document.querySelectorAll('link[rel="stylesheet"]:not([media="print"]):not([data-critical])') as NodeListOf<HTMLLinkElement>;
    blockingCSS.forEach(link => {
      if (link.href && !link.href.includes('critical')) {
        const newLink = document.createElement('link');
        newLink.rel = 'preload';
        newLink.as = 'style';
        newLink.href = link.href;
        newLink.onload = function() {
          (this as HTMLLinkElement).onload = null;
          (this as HTMLLinkElement).rel = 'stylesheet';
        };
        if (link.parentNode) {
          link.parentNode.insertBefore(newLink, link);
          link.remove();
        }
      }
    });
  };

  ensureCriticalCSS();
  removeRenderBlocking();
};

// Initialize render blocking optimizations
export const initRenderBlockingOptimizations = () => {
  eliminateRenderBlocking();
  optimizeCriticalPath();
};