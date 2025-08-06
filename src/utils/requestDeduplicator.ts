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
  private readonly dedupWindowMs: number = 2000; // 2 seconds
  
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
    
    // Clean up expired requests
    this.cleanup();
    
    // Create new request
    console.log(`🚀 Making new request: ${key}`);
    const promise = requestFn().finally(() => {
      // Remove from pending after completion
      this.pendingRequests.delete(key);
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
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
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