// Cache manager to reduce redundant requests and embedded site data issues
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttlMs: number = 2 * 60 * 1000) { // 2 minute default TTL
    this.cache.set(key, {
      data: data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
  
  // Clear expired items
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const cacheManager = new CacheManager();

// Auto cleanup every 5 minutes
setInterval(() => cacheManager.cleanup(), 5 * 60 * 1000);