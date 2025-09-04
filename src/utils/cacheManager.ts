/**
 * Cache Manager Utility
 * Handles cache clearing and versioning with session preservation
 */

const CACHE_VERSION_KEY = 'app_cache_version';
const CURRENT_VERSION = '1.0.2';
const SUPABASE_SESSION_KEYS = [
  'sb-ihzyuyfawapweamqzzlj-auth-token',
  'supabase.auth.token',
  'sb-auth-token',
  'circle-auth-v1' // Custom session key from Supabase client
];

class CacheManager {
  private lastSelfHealTime = 0;
  private readonly SELF_HEAL_THROTTLE = 10 * 60 * 1000; // 10 minutes

  /**
   * Clear all browser caches if version mismatch
   */
  checkAndClearCache(): void {
    const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    
    if (storedVersion !== CURRENT_VERSION) {
      this.clearAllCachePreserveSession();
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
    }
  }

  /**
   * Clear all types of browser cache while preserving Supabase session
   */
  async clearAllCachePreserveSession(): Promise<void> {
    try {
      console.log('🧹 Enhanced cache clearing while preserving session...');
      
      // Preserve Supabase session data and recovery context
      const sessionData: Record<string, string | null> = {};
      SUPABASE_SESSION_KEYS.forEach(key => {
        sessionData[key] = localStorage.getItem(key);
      });

      // Preserve recovery-related session storage
      const reloadReason = sessionStorage.getItem('last_reload_reason');
      const recoveryContext = sessionStorage.getItem('recovery_context');

      // Clear localStorage (except preserved items)
      const preserveKeys = [...SUPABASE_SESSION_KEYS, 'app_version', 'user_preferences'];
      const allKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) allKeys.push(key);
      }
      
      allKeys.forEach(key => {
        if (!preserveKeys.some(preserve => key.includes(preserve))) {
          localStorage.removeItem(key);
        }
      });

      // Restore session data
      Object.entries(sessionData).forEach(([key, value]) => {
        if (value) {
          localStorage.setItem(key, value);
        }
      });

      // Clear sessionStorage (except for recovery info)
      sessionStorage.clear();
      if (reloadReason) {
        sessionStorage.setItem('last_reload_reason', reloadReason);
      }
      if (recoveryContext) {
        sessionStorage.setItem('recovery_context', recoveryContext);
      }

      // Clear service worker caches with retry logic
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const deletePromises = cacheNames.map(async (cacheName) => {
            try {
              await caches.delete(cacheName);
              console.log(`Cleared cache: ${cacheName}`);
            } catch (error) {
              console.warn(`Failed to clear cache ${cacheName}:`, error);
            }
          });
          await Promise.allSettled(deletePromises);
        } catch (error) {
          console.warn('Failed to clear some service worker caches:', error);
        }
      }

      // Clear any browser-specific caches if available
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          console.log('Storage usage after cleanup:', estimate);
        } catch (error) {
          console.warn('Could not estimate storage usage:', error);
        }
      }

      console.log('✅ Enhanced cache cleared successfully, session preserved');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw new Error(`Cache clearing failed: ${error.message}`);
    }
  }
  
  /**
   * Clear all types of browser cache (including session)
   */
  async clearAllCache(): Promise<void> {
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear service worker cache if available - await for completion
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      console.log('🧹 Cache cleared completely');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Check if self-healing is throttled
   */
  canSelfHeal(): boolean {
    const now = Date.now();
    return (now - this.lastSelfHealTime) >= this.SELF_HEAL_THROTTLE;
  }

  /**
   * Mark self-healing as executed
   */
  markSelfHealExecuted(): void {
    this.lastSelfHealTime = Date.now();
  }
  
  /**
   * Force page reload with cache bypass using query parameter
   */
  forceReload(reason: 'self_heal' | 'version_update' | 'manual' = 'manual'): void {
    // Store reload reason for diagnostic banner
    sessionStorage.setItem('last_reload_reason', reason);
    
    const url = new URL(window.location.href);
    url.searchParams.set('_cb', Date.now().toString());
    window.location.href = url.toString();
  }

  /**
   * Get cache information for diagnostics
   */
  getCacheInfo(): { size: number; entries: string[] } {
    const keys = Object.keys(localStorage);
    return {
      size: keys.length,
      entries: keys.slice(0, 10) // Show first 10 keys for brevity
    };
  }
}

export const cacheManager = new CacheManager();