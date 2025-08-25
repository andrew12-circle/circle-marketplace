// Network optimization utilities - simplified to avoid non-existent chunk preloading
export const optimizeNetworkChains = () => {
  if (typeof window === 'undefined') return;

  // Only preload resources we know exist - skip dynamic chunk preloading

  // Preconnect to external domains early
  const externalDomains = [
    'https://storage.googleapis.com',
    'https://encrypted-tbn0.gstatic.com'
  ];

  externalDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // Optimize font loading to prevent render blocking
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
  fontLink.as = 'style';
  fontLink.onload = () => {
    fontLink.rel = 'stylesheet';
  };
  document.head.appendChild(fontLink);
};

// Break up critical rendering path
export const deferNonCriticalResources = () => {
  if (typeof window === 'undefined') return;

  // Defer analytics and tracking scripts
  const deferredScripts = [
    'gtag',
    'analytics',
    'tracking'
  ];

  deferredScripts.forEach(scriptName => {
    const scripts = document.querySelectorAll(`script[src*="${scriptName}"]`);
    scripts.forEach(script => {
      script.setAttribute('defer', '');
      script.setAttribute('loading', 'lazy');
    });
  });

  // Lazy load images that are not LCP candidates
  const images = document.querySelectorAll('img:not([fetchpriority="high"])');
  images.forEach(img => {
    if (!img.getAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  });
};

// Initialize network optimizations early
export const initNetworkOptimizations = () => {
  // Run immediately for critical resources
  optimizeNetworkChains();
  
  // Defer non-critical optimizations
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(deferNonCriticalResources);
  } else {
    setTimeout(deferNonCriticalResources, 100);
  }
};