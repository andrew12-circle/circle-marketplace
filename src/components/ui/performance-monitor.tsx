import { useEffect } from 'react';

// Performance monitoring component to track Core Web Vitals
export const PerformanceMonitor = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor LCP (Largest Contentful Paint)
    const observeLCP = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.startTime);
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.log('LCP observation not supported');
      }
    };

    // Monitor FID (First Input Delay)
    const observeFID = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const fidEntry = entry as any;
            if (fidEntry.processingStart) {
              console.log('FID:', fidEntry.processingStart - fidEntry.startTime);
            }
          }
        });
        observer.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.log('FID observation not supported');
      }
    };

    // Monitor CLS (Cumulative Layout Shift)
    const observeCLS = () => {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const clsEntry = entry as any;
            if (!clsEntry.hadRecentInput && clsEntry.value !== undefined) {
              clsValue += clsEntry.value;
            }
          }
          console.log('CLS:', clsValue);
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.log('CLS observation not supported');
      }
    };

    // Monitor Total Blocking Time
    const observeTBT = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const blockingTime = Math.max(0, entry.duration - 50);
            if (blockingTime > 0) {
              console.log('Long Task:', blockingTime);
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        console.log('Long task observation not supported');
      }
    };

    // Initialize monitoring
    requestIdleCallback(() => {
      observeLCP();
      observeFID(); 
      observeCLS();
      observeTBT();
    });

  }, []);

  return null;
};