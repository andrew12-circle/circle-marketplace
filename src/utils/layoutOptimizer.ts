import React from 'react';

/**
 * Performance utilities to prevent forced reflows
 * by batching DOM reads and using requestAnimationFrame
 */

type LayoutMeasurement = {
  element: Element;
  callback: (measurements: DOMRect) => void;
};

class LayoutMeasurementBatcher {
  private pending: LayoutMeasurement[] = [];
  private scheduled = false;

  measure(element: Element, callback: (measurements: DOMRect) => void) {
    this.pending.push({ element, callback });
    
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  private flush() {
    const measurements = this.pending.map(({ element, callback }) => {
      const rect = element.getBoundingClientRect();
      return { callback, rect };
    });

    this.pending = [];
    this.scheduled = false;

    // Execute callbacks after all measurements are done
    measurements.forEach(({ callback, rect }) => {
      callback(rect);
    });
  }
}

export const layoutBatcher = new LayoutMeasurementBatcher();

// Debounced scroll handler to prevent excessive calculations
export function createOptimizedScrollHandler(
  handler: (scrollData: { scrollY: number; scrollPercent: number }) => void,
  throttleMs: number = 16
) {
  let ticking = false;
  
  return () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const scrollPercent = (scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        handler({ scrollY, scrollPercent });
        ticking = false;
      });
      ticking = true;
    }
  };
}

// Optimized element measurement hook
export function useOptimizedMeasurement(
  ref: React.RefObject<Element>,
  dependency?: any
) {
  const [measurements, setMeasurements] = React.useState<DOMRect | null>(null);
  
  React.useEffect(() => {
    if (ref.current) {
      layoutBatcher.measure(ref.current, setMeasurements);
    }
  }, [ref, dependency]);
  
  return measurements;
}

// Throttled resize observer to prevent excessive reflows
export function createOptimizedResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void,
  throttleMs: number = 16
) {
  let ticking = false;
  let pendingEntries: ResizeObserverEntry[] = [];
  
  return new ResizeObserver((entries) => {
    pendingEntries = entries;
    
    if (!ticking) {
      requestAnimationFrame(() => {
        callback(pendingEntries);
        ticking = false;
      });
      ticking = true;
    }
  });
}