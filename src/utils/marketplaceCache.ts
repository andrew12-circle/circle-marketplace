/**
 * Marketplace Cache Utilities
 * Enhanced caching with intelligent invalidation strategies
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

class MarketplaceCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalRequests: 0
  };
  
  // Cache TTL configurations
  private readonly cacheTTL = {
    vendors: 5 * 60 * 1000, // 5 minutes - vendors change less frequently
    services: 2 * 60 * 1000, // 2 minutes - services more dynamic
    combined: 3 * 60 * 1000, // 3 minutes - combined data
    savedServices: 1 * 60 * 1000, // 1 minute - user-specific data
  };
  
  /**
   * Get data from cache if valid
   */
  get<T>(key: string): T | null {
    this.metrics.totalRequests++;
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }
    
    this.metrics.hits++;
    this.updateHitRate();
    console.log(`💾 Cache hit: ${key}`);
    return entry.data;
  }
  
  /**
   * Set data in cache with TTL
   */
  set<T>(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.getTTLForKey(key);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    console.log(`📦 Cache set: ${key} (TTL: ${ttl / 1000}s)`);
  }
  
  /**
   * Get appropriate TTL based on cache key
   */
  private getTTLForKey(key: string): number {
    if (key.includes('vendors')) return this.cacheTTL.vendors;
    if (key.includes('services')) return this.cacheTTL.services;
    if (key.includes('combined')) return this.cacheTTL.combined;
    if (key.includes('saved')) return this.cacheTTL.savedServices;
    return this.cacheTTL.services; // default
  }
  
  /**
   * Invalidate specific cache entries
   */
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      console.log('🗑️ Cache cleared completely');
      return;
    }
    
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    );
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      console.log(`🗑️ Cache invalidated: ${key}`);
    });
  }
  
  /**
   * Invalidate cache for user-specific data
   */
  invalidateUserData(userId: string): void {
    this.invalidate(`user:${userId}`);
  }
  
  /**
   * Background refresh: update cache with fresh data
   */
  async backgroundRefresh<T>(
    key: string, 
    fetchFn: () => Promise<T>
  ): Promise<void> {
    try {
      const freshData = await fetchFn();
      this.set(key, freshData);
      console.log(`🔄 Background refresh completed: ${key}`);
    } catch (error) {
      console.error(`❌ Background refresh failed: ${key}`, error);
    }
  }
  
  /**
   * Get cache metrics for debugging
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    this.metrics.hitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0;
  }
  
  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired cache entries`);
    }
  }
  
  /**
   * Get cache size info
   */
  getCacheInfo(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
export const marketplaceCache = new MarketplaceCache();

// Auto cleanup every 15 minutes (reduced frequency)
const cleanupInterval = setInterval(() => {
  marketplaceCache.cleanup();
}, 15 * 60 * 1000);

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => clearInterval(cleanupInterval));
}