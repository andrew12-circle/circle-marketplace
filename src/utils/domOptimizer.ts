import { taskScheduler, processInChunks } from '@/utils/taskScheduler';

// Non-blocking DOM operations to reduce TBT
export const optimizeDOMOperations = () => {
  // Cache commonly accessed DOM elements
  const domCache = new Map<string, Element>();
  
  return {
    // Non-blocking element queries
    queryElement: (selector: string): Promise<Element | null> => {
      return new Promise((resolve) => {
        taskScheduler.schedule(() => {
          if (domCache.has(selector)) {
            resolve(domCache.get(selector) || null);
          } else {
            const element = document.querySelector(selector);
            if (element) {
              domCache.set(selector, element);
            }
            resolve(element);
          }
        });
      });
    },

    // Batch DOM updates to minimize reflows
    batchUpdates: (updates: Array<() => void>) => {
      taskScheduler.schedule(() => {
        // Use DocumentFragment for efficient DOM manipulation
        const fragment = document.createDocumentFragment();
        
        // Apply all updates in a single batch
        updates.forEach(update => {
          try {
            update();
          } catch (error) {
            console.warn('DOM update error:', error);
          }
        });
      });
    },

    // Process large lists without blocking
    processLargeList: async <T>(
      items: T[],
      renderItem: (item: T) => HTMLElement,
      container: HTMLElement
    ) => {
      const fragment = document.createDocumentFragment();
      
      await processInChunks(items, (item) => {
        const element = renderItem(item);
        fragment.appendChild(element);
      }, 5); // Smaller chunks for DOM operations
      
      // Append all at once to minimize reflows
      taskScheduler.schedule(() => {
        container.appendChild(fragment);
      });
    }
  };
};

// Optimize event handlers to prevent blocking
export const createNonBlockingHandler = (handler: (...args: any[]) => void) => {
  return (...args: any[]) => {
    taskScheduler.schedule(() => {
      handler(...args);
    });
  };
};

// Initialize DOM optimizations
export const initDOMOptimizations = () => {
  if (typeof window === 'undefined') return;
  
  // Optimize scroll handlers
  let scrollHandler: (() => void) | null = null;
  
  const optimizedScrollHandler = () => {
    if (!scrollHandler) {
      scrollHandler = createNonBlockingHandler(() => {
        // Process scroll-related updates
        scrollHandler = null;
      });
    }
    scrollHandler();
  };
  
  // Use passive listeners for better performance
  window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
  window.addEventListener('resize', optimizedScrollHandler, { passive: true });
};