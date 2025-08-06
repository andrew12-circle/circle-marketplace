/**
 * Cache Manager Utility
 * Handles cache clearing and versioning
 */

const CACHE_VERSION_KEY = 'app_cache_version';
const CURRENT_VERSION = '1.0.1';

class CacheManager {
  /**
   * Clear all browser caches if version mismatch
   */
  checkAndClearCache(): void {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    
    if (storedVersion !== CURRENT_VERSION) {
      this.clearAllCache();
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
    }
  }
  
  /**
   * Clear all types of browser cache
   */
  clearAllCache(): void {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear service worker cache if available
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      
      console.log('🧹 Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
  
  /**
   * Force page reload with cache bypass
   */
  forceReload(): void {
    window.location.reload();
  }
}

export const cacheManager = new CacheManager();