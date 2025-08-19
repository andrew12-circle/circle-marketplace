import { useEffect } from 'react';
import { trackLaunchMetric } from './LaunchMetrics';

export const PerformanceMonitor = () => {
  useEffect(() => {
    // Track Core Web Vitals for launch monitoring
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          trackLaunchMetric('engagement', {
            metric: 'page_load_time',
            value: navEntry.loadEventEnd - navEntry.loadEventStart,
            url: window.location.pathname
          });
        }

        if (entry.entryType === 'largest-contentful-paint') {
          trackLaunchMetric('engagement', {
            metric: 'largest_contentful_paint',
            value: entry.startTime,
            url: window.location.pathname
          });
        }

        if (entry.entryType === 'first-input') {
          const fidEntry = entry as PerformanceEventTiming;
          trackLaunchMetric('engagement', {
            metric: 'first_input_delay',
            value: fidEntry.processingStart - fidEntry.startTime,
            url: window.location.pathname
          });
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint', 'first-input'] });
    } catch (error) {
      console.debug('Performance monitoring not supported:', error);
    }

    // Track errors
    const errorHandler = (event: ErrorEvent) => {
      trackLaunchMetric('error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    };

    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      trackLaunchMetric('error', {
        type: 'unhandled_promise_rejection',
        reason: event.reason?.toString()
      });
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);

    return () => {
      observer.disconnect();
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    };
  }, []);

  return null;
};