// Time-slicing utilities to reduce Total Blocking Time
export class TaskScheduler {
  private taskQueue: Array<() => void> = [];
  private isRunning = false;

  // Schedule a task to run in the next available time slice
  schedule(task: () => void) {
    this.taskQueue.push(task);
    if (!this.isRunning) {
      this.runTasks();
    }
  }

  // Break up work into smaller chunks to avoid blocking
  private runTasks() {
    this.isRunning = true;
    
    const runChunk = () => {
      const start = performance.now();
      
      // Process tasks for up to 5ms at a time to stay under 50ms blocking threshold
      while (this.taskQueue.length > 0 && (performance.now() - start) < 5) {
        const task = this.taskQueue.shift();
        if (task) {
          try {
            task();
          } catch (error) {
            console.warn('Task scheduler error:', error);
          }
        }
      }
      
      // If more tasks remain, yield to the main thread
      if (this.taskQueue.length > 0) {
        this.yieldToMainThread(runChunk);
      } else {
        this.isRunning = false;
      }
    };
    
    runChunk();
  }

  // Yield control back to the main thread
  private yieldToMainThread(callback: () => void) {
    if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
      // Use modern scheduler API if available
      (window as any).scheduler.postTask(callback, { priority: 'user-blocking' });
    } else if ('requestIdleCallback' in window) {
      // Use requestIdleCallback for lower priority
      (window as any).requestIdleCallback(callback, { timeout: 16 });
    } else {
      // Fallback to MessageChannel for immediate yielding
      const channel = new MessageChannel();
      channel.port2.onmessage = () => callback();
      channel.port1.postMessage(null);
    }
  }
}

// Global task scheduler instance
export const taskScheduler = new TaskScheduler();

// Utility to break up large data processing
export function processInChunks<T>(
  items: T[],
  processor: (item: T) => void,
  chunkSize = 10
): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;
    
    const processChunk = () => {
      const endIndex = Math.min(index + chunkSize, items.length);
      
      for (let i = index; i < endIndex; i++) {
        processor(items[i]);
      }
      
      index = endIndex;
      
      if (index < items.length) {
        taskScheduler.schedule(processChunk);
      } else {
        resolve();
      }
    };
    
    processChunk();
  });
}

// Debounced task execution to prevent rapid firing
export function debounceTask(func: () => void, delay = 100) {
  let timeoutId: NodeJS.Timeout;
  
  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      taskScheduler.schedule(func);
    }, delay);
  };
}

// Throttled task execution for high-frequency events
export function throttleTask(func: () => void, limit = 100) {
  let inThrottle = false;
  
  return () => {
    if (!inThrottle) {
      taskScheduler.schedule(func);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}