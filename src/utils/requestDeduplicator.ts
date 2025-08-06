/**
 * Request Deduplication System
 * Prevents duplicate API calls within a specified time window
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly dedupWindowMs: number = 5000; // 5 seconds for better navigation stability
  private abortControllers: Map<string, AbortController> = new Map();
  
  /**
   * Creates a unique key for the request based on endpoint and parameters
   */
  private createRequestKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramString}`;
  }
  
  /**
   * Executes a request with deduplication
   * If the same request is in flight, returns the existing promise
   */
  async dedupRequest<T>(
    endpoint: string, 
    requestFn: () => Promise<T>, 
    params?: Record<string, any>
  ): Promise<T> {
    const key = this.createRequestKey(endpoint, params);
    const now = Date.now();
    
    // Check if we have a pending request
    const pending = this.pendingRequests.get(key);
    
    if (pending && (now - pending.timestamp) < this.dedupWindowMs) {
      console.log(`🔄 Deduplicating request: ${key}`);
      return pending.promise;
    }
    
    // Cancel any existing request for this key
    const existingController = this.abortControllers.get(key);
    if (existingController) {
      existingController.abort();
      this.abortControllers.delete(key);
    }
    
    // Clean up expired requests
    this.cleanup();
    
    // Create abort controller for new request
    const abortController = new AbortController();
    this.abortControllers.set(key, abortController);
    
    // Create new request
    console.log(`🚀 Making new request: ${key}`);
    const promise = requestFn().finally(() => {
      // Remove from pending after completion
      this.pendingRequests.delete(key);
      this.abortControllers.delete(key);
    });
    
    this.pendingRequests.set(key, {
      promise,
      timestamp: now
    });
    
    return promise;
  }
  
  /**
   * Clean up expired pending requests
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.dedupWindowMs * 2) {
        this.pendingRequests.delete(key);
      }
    }
  }
  
  /**
   * Clear all pending requests and abort controllers
   */
  clear(): void {
    // Abort all pending requests
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.pendingRequests.clear();
    this.abortControllers.clear();
  }

  /**
   * Cancel requests matching a pattern
   */
  cancelRequests(pattern: string): void {
    for (const [key, controller] of this.abortControllers.entries()) {
      if (key.includes(pattern)) {
        controller.abort();
        this.pendingRequests.delete(key);
        this.abortControllers.delete(key);
      }
    }
  }
  
  /**
   * Get pending request count for debugging
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

// Global instance
export const requestDeduplicator = new RequestDeduplicator();