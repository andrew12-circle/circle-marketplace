/**
 * Performance Monitoring Utility
 * Tracks API calls, cache performance, and user experience metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface RequestMetric {
  endpoint: string;
  method: string;
  duration: number;
  success: boolean;
  cached: boolean;
  timestamp: number;
  size?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private requestMetrics: RequestMetric[] = [];
  private readonly maxMetrics = 100; // Keep last 100 metrics
  
  /**
   * Track a performance metric
   */
  track(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };
    
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
    
    console.log(`📊 Performance: ${name} = ${value}ms`, metadata);
  }
  
  /**
   * Track API request performance
   */
  trackRequest(
    endpoint: string, 
    method: string, 
    duration: number, 
    success: boolean, 
    cached: boolean = false,
    size?: number
  ): void {
    const metric: RequestMetric = {
      endpoint,
      method,
      duration,
      success,
      cached,
      timestamp: Date.now(),
      size
    };
    
    this.requestMetrics.push(metric);
    
    // Keep only recent requests
    if (this.requestMetrics.length > this.maxMetrics) {
      this.requestMetrics = this.requestMetrics.slice(-this.maxMetrics);
    }
    
    const status = success ? '✅' : '❌';
    const cacheStatus = cached ? '💾' : '🌐';
    console.log(`${status} ${cacheStatus} ${method} ${endpoint}: ${duration}ms`);
  }
  
  /**
   * Start timing an operation
   */
  startTimer(name: string): () => void {
    const startTime = performance.now();
    
    return (metadata?: Record<string, any>) => {
      const duration = performance.now() - startTime;
      this.track(name, duration, metadata);
    };
  }
  
  /**
   * Get performance statistics
   */
  getStats(): {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    cacheHitRate: number;
    slowestRequests: RequestMetric[];
    recentMetrics: PerformanceMetric[];
  } {
    const totalRequests = this.requestMetrics.length;
    const successfulRequests = this.requestMetrics.filter(r => r.success).length;
    const cachedRequests = this.requestMetrics.filter(r => r.cached).length;
    
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    const cacheHitRate = totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0;
    
    const totalDuration = this.requestMetrics.reduce((sum, r) => sum + r.duration, 0);
    const averageResponseTime = totalRequests > 0 ? totalDuration / totalRequests : 0;
    
    const slowestRequests = [...this.requestMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);
    
    return {
      totalRequests,
      successRate: Math.round(successRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      slowestRequests,
      recentMetrics: this.metrics.slice(-10)
    };
  }
  
  /**
   * Get detailed cache performance
   */
  getCacheStats(): {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    timesSaved: number;
  } {
    const totalRequests = this.requestMetrics.length;
    const cacheHits = this.requestMetrics.filter(r => r.cached).length;
    const cacheMisses = totalRequests - cacheHits;
    const hitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
    
    // Estimate time saved by caching (assuming cache hits are 95% faster)
    const cachedDuration = this.requestMetrics
      .filter(r => r.cached)
      .reduce((sum, r) => sum + r.duration, 0);
    const uncachedDuration = this.requestMetrics
      .filter(r => !r.cached)
      .reduce((sum, r) => sum + r.duration, 0);
    
    const avgUncachedTime = uncachedDuration / (totalRequests - cacheHits || 1);
    const timesSaved = cacheHits * avgUncachedTime * 0.95; // 95% time saving estimate
    
    return {
      totalRequests,
      cacheHits,
      cacheMisses,
      hitRate: Math.round(hitRate * 100) / 100,
      timesSaved: Math.round(timesSaved)
    };
  }
  
  /**
   * Log performance summary to console
   */
  logSummary(): void {
    const stats = this.getStats();
    const cacheStats = this.getCacheStats();
    
    console.group('📊 Performance Summary');
    console.log('Total API Requests:', stats.totalRequests);
    console.log('Success Rate:', `${stats.successRate}%`);
    console.log('Average Response Time:', `${stats.averageResponseTime}ms`);
    console.log('Cache Hit Rate:', `${stats.cacheHitRate}%`);
    console.log('Time Saved by Caching:', `${cacheStats.timesSaved}ms`);
    
    if (stats.slowestRequests.length > 0) {
      console.log('Slowest Requests:');
      stats.slowestRequests.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.method} ${req.endpoint}: ${req.duration}ms`);
      });
    }
    
    console.groupEnd();
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.requestMetrics = [];
    console.log('🧹 Performance metrics cleared');
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-log summary every 10 minutes in development (reduced frequency)
if (process.env.NODE_ENV === 'development') {
  const interval = setInterval(() => {
    performanceMonitor.logSummary();
  }, 10 * 60 * 1000);
  
  // Cleanup on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => clearInterval(interval));
  }
}
