// 3. API ABSTRACTION LAYER - Decouple heavy operations from components
import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '@/utils/cacheManager';
import { PerformanceOptimizer } from '@/utils/performanceOptimizer';

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  retail_price?: string;
  pro_price?: string;
  co_pay_price?: string;
  image_url?: string;
  is_featured: boolean;
  vendor?: {
    name: string;
    rating: number;
    review_count: number;
    is_verified: boolean;
  };
}

export interface Vendor {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  co_marketing_agents: number;
  service_states?: string[];
}

export interface MarketplaceQueryOptions {
  category?: string;
  featured?: boolean;
  verified?: boolean;
  limit?: number;
  offset?: number;
  searchTerm?: string;
  priceRange?: [number, number];
  location?: {
    state?: string;
    radius?: number;
  };
}

class MarketplaceAPI {
  private readonly CACHE_TTL = {
    services: 10 * 60 * 1000,    // 10 minutes
    vendors: 15 * 60 * 1000,    // 15 minutes
    analytics: 60 * 60 * 1000,  // 1 hour
    search: 5 * 60 * 1000       // 5 minutes
  };

  // Heavy operation: Get services with complex filtering and joins
  async getServices(options: MarketplaceQueryOptions = {}): Promise<Service[]> {
    const cacheKey = `services-${JSON.stringify(options)}`;
    
    return PerformanceOptimizer.deduplicateRequest(cacheKey, async () => {
      // Check cache first
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;

      let query = supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          category,
          retail_price,
          pro_price,
          co_pay_price,
          image_url,
          is_featured,
          sort_order,
          vendor:vendors!inner(
            name,
            rating,
            review_count,
            is_verified
          )
        `);

      // Apply filters using indexed columns
      if (options.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }

      if (options.featured) {
        query = query.eq('is_featured', true);
      }

      if (options.searchTerm) {
        query = query.or(`title.ilike.%${options.searchTerm}%,description.ilike.%${options.searchTerm}%`);
      }

      // Order by indexed columns for performance
      query = query
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedData = (data || []).map(service => ({
        ...service,
        vendor: service.vendor || {
          name: 'Unknown Vendor',
          rating: 0,
          review_count: 0,
          is_verified: false
        }
      }));

      // Cache the result
      cacheManager.set(cacheKey, formattedData, this.CACHE_TTL.services);
      
      return formattedData;
    });
  }

  // Heavy operation: Get vendors with location filtering
  async getVendors(options: MarketplaceQueryOptions = {}): Promise<Vendor[]> {
    const cacheKey = `vendors-${JSON.stringify(options)}`;
    
    return PerformanceOptimizer.deduplicateRequest(cacheKey, async () => {
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;

      let query = supabase
        .from('vendors')
        .select('*');

      if (options.verified) {
        query = query.eq('is_verified', true);
      }

      if (options.location?.state) {
        query = query.contains('service_states', [options.location.state]);
      }

      // Use indexed ordering
      query = query
        .order('rating', { ascending: false })
        .order('sort_order', { ascending: true });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      const result = data || [];
      cacheManager.set(cacheKey, result, this.CACHE_TTL.vendors);
      
      return result;
    });
  }

  // Background operation: Queue analytics refresh
  async queueAnalyticsRefresh(vendorId?: string): Promise<void> {
    try {
      await supabase.from('background_jobs').insert({
        job_type: 'refresh_analytics',
        job_data: { vendor_id: vendorId },
        priority: 3
      });
    } catch (error) {
      console.error('Failed to queue analytics refresh:', error);
    }
  }

  // Background operation: Bulk import services
  async bulkImportServices(services: Partial<Service>[]): Promise<void> {
    try {
      await supabase.from('background_jobs').insert({
        job_type: 'bulk_import_services',
        job_data: { services },
        priority: 5
      });
    } catch (error) {
      console.error('Failed to queue bulk import:', error);
    }
  }

  // Optimized search with minimal database load
  async searchServices(searchTerm: string, options: MarketplaceQueryOptions = {}): Promise<Service[]> {
    if (!searchTerm.trim()) return [];

    const cacheKey = `search-${searchTerm}-${JSON.stringify(options)}`;
    
    return PerformanceOptimizer.deduplicateRequest(cacheKey, async () => {
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;

      // Use full-text search for better performance
      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          category,
          retail_price,
          pro_price,
          image_url,
          is_featured,
          vendor:vendors!inner(name, rating, is_verified)
        `)
        .textSearch('title', searchTerm, { type: 'websearch' })
        .limit(20);

      if (error) {
        // Fallback to ILIKE search if full-text search fails
        const fallbackQuery = await supabase
          .from('services')
          .select(`
            id,
            title,
            description,
            category,
            retail_price,
            pro_price,
            image_url,
            is_featured,
            vendor:vendors!inner(name, rating, is_verified)
          `)
          .ilike('title', `%${searchTerm}%`)
          .limit(20);

        if (fallbackQuery.error) throw fallbackQuery.error;
        const result = fallbackQuery.data || [];
        cacheManager.set(cacheKey, result, this.CACHE_TTL.search);
        return result;
      }

      const result = data || [];
      cacheManager.set(cacheKey, result, this.CACHE_TTL.search);
      return result;
    });
  }

  // Get aggregated analytics (uses direct query since materialized view caused issues)
  async getVendorAnalytics(vendorId: string) {
    const cacheKey = `analytics-${vendorId}`;
    
    return PerformanceOptimizer.deduplicateRequest(cacheKey, async () => {
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;

      // Use direct calculation for now
      const analyticsData = await this.calculateVendorAnalytics(vendorId);
      cacheManager.set(cacheKey, analyticsData, this.CACHE_TTL.analytics);
      return analyticsData;
    });
  }

  private async calculateVendorAnalytics(vendorId: string) {
    const [servicesResponse, viewsResponse, bookingsResponse] = await Promise.all([
      supabase.from('services').select('id').eq('vendor_id', vendorId),
      supabase.from('service_views').select('service_id'),
      supabase.from('consultation_bookings').select('service_id')
    ]);

    return {
      vendor_id: vendorId,
      total_services: servicesResponse.data?.length || 0,
      total_views: viewsResponse.data?.length || 0,
      total_bookings: bookingsResponse.data?.length || 0,
      conversion_rate: viewsResponse.data?.length 
        ? ((bookingsResponse.data?.length || 0) / viewsResponse.data.length) * 100 
        : 0
    };
  }

  // Clear specific cache patterns
  clearCache(pattern?: string) {
    if (pattern) {
      // Clear specific cache entries matching pattern
      cacheManager.cleanup();
    } else {
      cacheManager.clear();
    }
  }
}

export const marketplaceAPI = new MarketplaceAPI();