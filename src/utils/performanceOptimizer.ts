// Performance optimization utilities
export class PerformanceOptimizer {
  private static requestDeduplication = new Map<string, Promise<any>>();
  
  // Deduplicate identical requests
  static async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.requestDeduplication.has(key)) {
      return this.requestDeduplication.get(key);
    }
    
    const promise = requestFn();
    this.requestDeduplication.set(key, promise);
    
    // Clean up after request completes
    promise.finally(() => {
      this.requestDeduplication.delete(key);
    });
    
    return promise;
  }
  
  // Debounce function calls
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }
  
  // Throttle function calls
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Global error recovery mechanism
export const withErrorRecovery = <T>(
  operation: () => Promise<T>,
  fallback: T,
  maxRetries: number = 3
): Promise<T> => {
  return new Promise(async (resolve) => {
    let attempts = 0;
    
    const attempt = async (): Promise<void> => {
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        attempts++;
        
        if (attempts < maxRetries) {
          console.warn(`Operation failed, retrying (${attempts}/${maxRetries})`, error);
          setTimeout(attempt, Math.pow(2, attempts) * 1000); // Exponential backoff
        } else {
          console.error('Operation failed after max retries, using fallback', error);
          resolve(fallback);
        }
      }
    };
    
    attempt();
  });
};