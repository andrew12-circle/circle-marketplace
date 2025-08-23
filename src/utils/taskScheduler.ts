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
      
      // More aggressive yielding - process tasks for only 3ms to reduce FID
      while (this.taskQueue.length > 0 && (performance.now() - start) < 3) {
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

  // Yield control back to the main thread with priority for input responsiveness
  private yieldToMainThread(callback: () => void) {
    if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
      // Use modern scheduler API with background priority to allow input handling
      (window as any).scheduler.postTask(callback, { priority: 'background' });
    } else {
      // Use setTimeout for immediate yielding (better for FID than requestIdleCallback)
      setTimeout(callback, 0);
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