// Advanced caching and offline support using Service Worker patterns
class CacheManager {
  private static instance: CacheManager;
  private cacheNames = {
    static: 'circle-static-v1',
    dynamic: 'circle-dynamic-v1',
    api: 'circle-api-v1',
    images: 'circle-images-v1'
  };

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Cache API responses with TTL
  async cacheApiResponse(url: string, response: Response, ttl = 300000) { // 5 minutes default
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheNames.api);
        const responseToCache = response.clone();
        
        // Add timestamp for TTL
        const headers = new Headers(responseToCache.headers);
        headers.set('cached-at', Date.now().toString());
        headers.set('cache-ttl', ttl.toString());
        
        const modifiedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers
        });
        
        await cache.put(url, modifiedResponse);
      } catch (error) {
        console.warn('Failed to cache API response:', error);
      }
    }
  }

  // Get cached API response if valid
  async getCachedApiResponse(url: string): Promise<Response | null> {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheNames.api);
        const cachedResponse = await cache.match(url);
        
        if (cachedResponse) {
          const cachedAt = parseInt(cachedResponse.headers.get('cached-at') || '0');
          const ttl = parseInt(cachedResponse.headers.get('cache-ttl') || '300000');
          
          if (Date.now() - cachedAt < ttl) {
            return cachedResponse;
          } else {
            // Cache expired, remove it
            await cache.delete(url);
          }
        }
      } catch (error) {
        console.warn('Failed to get cached response:', error);
      }
    }
    return null;
  }

  // Preload critical resources
  async preloadCriticalResources(urls: string[]) {
    if ('caches' in window) {
      try {
        const cache = await caches.open(this.cacheNames.static);
        const requests = urls.map(url => fetch(url));
        const responses = await Promise.allSettled(requests);
        
        const cachePromises = responses.map(async (result, index) => {
          if (result.status === 'fulfilled' && result.value.ok) {
            await cache.put(urls[index], result.value.clone());
          }
        });
        
        await Promise.allSettled(cachePromises);
      } catch (error) {
        console.warn('Failed to preload resources:', error);
      }
    }
  }

  // Clear old caches
  async clearOldCaches() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        const currentVersions = Object.values(this.cacheNames);
        
        const deletePromises = cacheNames
          .filter(cacheName => !currentVersions.includes(cacheName))
          .map(cacheName => caches.delete(cacheName));
        
        await Promise.all(deletePromises);
      } catch (error) {
        console.warn('Failed to clear old caches:', error);
      }
    }
  }

  // Get cache usage stats
  async getCacheStats() {
    if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage,
          quota: estimate.quota,
          usagePercentage: estimate.quota ? (estimate.usage! / estimate.quota) * 100 : 0
        };
      } catch (error) {
        console.warn('Failed to get cache stats:', error);
      }
    }
    return null;
  }
}

// Enhanced API client with caching and retry logic
class ApiClient {
  private cache = CacheManager.getInstance();
  private baseURL: string;
  private retryCount = 3;
  private retryDelay = 1000;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithRetry(
    url: string, 
    options: RequestInit = {}, 
    attempt = 1
  ): Promise<Response> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (response.ok) {
        // Cache successful GET requests
        if (!options.method || options.method === 'GET') {
          await this.cache.cacheApiResponse(url, response);
        }
        return response;
      } else if (response.status >= 500 && attempt < this.retryCount) {
        // Retry on server errors
        await this.delay(this.retryDelay * attempt);
        return this.fetchWithRetry(url, options, attempt + 1);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      if (attempt < this.retryCount && error instanceof TypeError) {
        // Network error, try again
        await this.delay(this.retryDelay * attempt);
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      // Try cache as fallback for GET requests
      if (!options.method || options.method === 'GET') {
        const cached = await this.cache.getCachedApiResponse(url);
        if (cached) {
          console.warn('Using cached response due to network error');
          return cached;
        }
      }

      throw error;
    }
  }

  async get<T>(endpoint: string, useCache = true): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Try cache first for GET requests
    if (useCache) {
      const cached = await this.cache.getCachedApiResponse(url);
      if (cached) {
        return cached.json();
      }
    }

    const response = await this.fetchWithRetry(url);
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

// Connection status manager
class ConnectionManager {
  private static instance: ConnectionManager;
  private listeners = new Set<(online: boolean) => void>();
  private _isOnline = navigator.onLine;

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  constructor() {
    window.addEventListener('online', () => {
      this._isOnline = true;
      this.notifyListeners(true);
    });

    window.addEventListener('offline', () => {
      this._isOnline = false;
      this.notifyListeners(false);
    });
  }

  get isOnline() {
    return this._isOnline;
  }

  private notifyListeners(online: boolean) {
    this.listeners.forEach(listener => listener(online));
  }

  onConnectionChange(callback: (online: boolean) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

// Initialize performance optimizations
export const initializePerformanceOptimizations = async () => {
  const cache = CacheManager.getInstance();
  
  // Preload critical resources
  const criticalResources = [
    '/favicon.ico',
    // Add your critical CSS/JS files here
  ];
  
  await cache.preloadCriticalResources(criticalResources);
  await cache.clearOldCaches();

  // Monitor cache usage
  const stats = await cache.getCacheStats();
  if (stats && stats.usagePercentage > 80) {
    console.warn('Cache usage high:', stats);
  }
};

export { CacheManager, ApiClient, ConnectionManager };