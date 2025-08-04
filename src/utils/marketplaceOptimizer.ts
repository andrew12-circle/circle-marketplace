// Marketplace-specific optimization utilities
import { cacheManager } from './cacheManager';
import { PerformanceOptimizer } from './performanceOptimizer';

interface OptimizedQuery {
  table: string;
  select: string;
  filters: Record<string, any>;
  orderBy?: { column: string; ascending: boolean }[];
  limit?: number;
}

export class MarketplaceOptimizer {
  private static queryCache = new Map<string, any>();
  
  // Optimize Supabase queries by building efficient query strings
  static buildOptimizedQuery(queryConfig: OptimizedQuery): string {
    const { table, select, filters, orderBy, limit } = queryConfig;
    
    let query = `${table}.select(${select})`;
    
    // Add filters in order of selectivity (most selective first)
    const filterKeys = Object.keys(filters).sort((a, b) => {
      // Prioritize indexed columns and equality filters
      const indexedColumns = ['category', 'is_featured', 'is_active', 'sort_order'];
      const aIsIndexed = indexedColumns.includes(a);
      const bIsIndexed = indexedColumns.includes(b);
      
      if (aIsIndexed && !bIsIndexed) return -1;
      if (!aIsIndexed && bIsIndexed) return 1;
      return 0;
    });
    
    filterKeys.forEach(key => {
      const value = filters[key];
      if (value !== undefined && value !== null) {
        query += `.${key}(${JSON.stringify(value)})`;
      }
    });
    
    // Add ordering - most important first
    if (orderBy) {
      orderBy.forEach(order => {
        query += `.order('${order.column}', { ascending: ${order.ascending} })`;
      });
    }
    
    if (limit) {
      query += `.limit(${limit})`;
    }
    
    return query;
  }
  
  // Pre-warm cache with essential marketplace data
  static async preWarmCache() {
    console.log('Pre-warming marketplace cache...');
    
    try {
      // Cache common queries
      const commonQueries = [
        { key: 'featured-services', cacheTime: 10 * 60 * 1000 }, // 10 minutes
        { key: 'top-vendors', cacheTime: 15 * 60 * 1000 }, // 15 minutes
        { key: 'categories', cacheTime: 30 * 60 * 1000 } // 30 minutes
      ];
      
      for (const query of commonQueries) {
        if (!cacheManager.get(query.key)) {
          // These would be replaced with actual data loading
          console.log(`Pre-warming cache for: ${query.key}`);
        }
      }
    } catch (error) {
      console.error('Error pre-warming cache:', error);
    }
  }
  
  // Optimize filters for database queries
  static optimizeFilters(filters: any) {
    const optimized = { ...filters };
    
    // Convert client-side filters to database-optimized versions
    if (optimized.priceRange) {
      // Convert to database-friendly price filtering
      delete optimized.priceRange;
      // Price filtering should be done on the client side for now
      // since it requires parsing string prices
    }
    
    if (optimized.searchTerm) {
      // For now, search is done client-side
      // TODO: Implement full-text search on the database
      delete optimized.searchTerm;
    }
    
    return optimized;
  }
  
  // Batch multiple requests to reduce database load
  static async batchRequests<T>(requests: Array<() => Promise<T>>): Promise<T[]> {
    // Use Promise.allSettled to handle partial failures
    const results = await Promise.allSettled(requests.map(req => req()));
    
    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error('Batch request failed:', result.reason);
        return null as T;
      }
    });
  }
  
  // Memory-efficient pagination
  static createPaginator<T>(items: T[], pageSize: number = 20) {
    return {
      getPage: (pageNumber: number): T[] => {
        const start = (pageNumber - 1) * pageSize;
        const end = start + pageSize;
        return items.slice(start, end);
      },
      getTotalPages: (): number => {
        return Math.ceil(items.length / pageSize);
      },
      hasNextPage: (currentPage: number): boolean => {
        return currentPage < Math.ceil(items.length / pageSize);
      }
    };
  }
  
  // Intelligent cache invalidation
  static invalidateRelatedCache(type: 'service' | 'vendor', id?: string) {
    const patterns = {
      service: ['marketplace-', 'services-', 'featured-services'],
      vendor: ['marketplace-', 'vendors-', 'top-vendors']
    };
    
    patterns[type].forEach(pattern => {
      // Clear cache entries that match the pattern
      console.log(`Invalidating cache pattern: ${pattern}`);
      // Implementation would iterate through cache keys
    });
  }
}

// Initialize pre-warming on module load
if (typeof window !== 'undefined') {
  // Only run in browser environment
  setTimeout(() => {
    MarketplaceOptimizer.preWarmCache();
  }, 1000);
}