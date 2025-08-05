// API abstraction layer for marketplace operations
import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '@/utils/cacheManager';
import { PerformanceOptimizer, withErrorRecovery } from '@/utils/performanceOptimizer';

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  discount_percentage?: string;
  retail_price?: string;
  pro_price?: string;
  co_pay_price?: string;
  image_url?: string;
  tags?: string[];
  is_featured: boolean;
  is_top_pick: boolean;
  estimated_roi?: number;
  duration?: string;
  requires_quote?: boolean;
  vendor: {
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
  website_url?: string;
  location?: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  co_marketing_agents: number;
  campaigns_funded: number;
  service_states?: string[];
  mls_areas?: string[];
  service_radius_miles?: number;
  license_states?: string[];
  latitude?: number;
  longitude?: number;
  vendor_type?: string;
  local_representatives?: any;
}

class MarketplaceAPI {
  private static instance: MarketplaceAPI;
  
  public static getInstance(): MarketplaceAPI {
    if (!MarketplaceAPI.instance) {
      MarketplaceAPI.instance = new MarketplaceAPI();
    }
    return MarketplaceAPI.instance;
  }

  // Optimized marketplace data loading with caching and API abstraction
  async getMarketplaceData(): Promise<{ services: Service[]; vendors: Vendor[] }> {
    const cacheKey = 'marketplace-data-optimized';
    
    return PerformanceOptimizer.deduplicateRequest(cacheKey, async () => {
      // Check cache first
      const cachedData = cacheManager.get(cacheKey);
      if (cachedData) {
        console.log('Loading marketplace data from cache...');
        return cachedData;
      }

      console.log('Loading marketplace data from API...');

      return withErrorRecovery(
        async () => {
          // Add timeout to prevent infinite loading
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Query timeout')), 10000); // 10 second timeout
          });

          console.log('Fetching data directly from database with timeout...');
          
          // Fetch vendors directly with timeout
          const vendorsPromise = supabase
            .from('vendors')
            .select('*');
          
          const { data: vendorsData, error: vendorsError } = await Promise.race([
            vendorsPromise,
            timeoutPromise
          ]) as any;
          
          if (vendorsError) {
            console.error('Error fetching vendors:', vendorsError);
          }

          // Fetch services with OPTIONAL vendor info (LEFT JOIN behavior)
          // This handles NULL vendor_id values gracefully
          const servicesPromise = supabase
            .from('services')
            .select(`
              *,
              vendor:vendor_id (
                name,
                rating,
                review_count,
                is_verified
              )
            `)
            .order('sort_order', { ascending: true })
            .order('is_featured', { ascending: false })
            .order('is_top_pick', { ascending: false });

          const { data: servicesData, error: servicesError } = await Promise.race([
            servicesPromise,
            timeoutPromise
          ]) as any;

          if (servicesError) {
            console.error('Error fetching services:', servicesError);
            throw servicesError;
          }

          // Process services to handle missing vendor data
          const processedServices = (servicesData || []).map((service: any) => ({
            ...service,
            vendor: service.vendor || {
              name: 'Circle Marketplace',
              rating: 0,
              review_count: 0,
              is_verified: false
            }
          }));

          const result = {
            services: processedServices,
            vendors: vendorsData || []
          };

          console.log('Direct DB fetch result:', { 
            services: result.services.length, 
            vendors: result.vendors.length,
            servicesWithNullVendor: result.services.filter(s => !s.vendor_id).length
          });

          // Cache the result
          cacheManager.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes cache
          
          return result;
        },
        { services: [], vendors: [] }, // Fallback
        2 // Max retries
      );
    });
  }

  // Optimized vendor analytics with caching
  async getVendorAnalytics(vendorId: string) {
    const cacheKey = `vendor-analytics-${vendorId}`;
    
    return PerformanceOptimizer.deduplicateRequest(cacheKey, async () => {
      const cachedData = cacheManager.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      return withErrorRecovery(
        async () => {
          const { data, error } = await supabase.functions.invoke('analytics-optimizer', {
            body: { action: 'get_cached_analytics', vendor_id: vendorId }
          });

          if (error) throw error;

          // Cache for 10 minutes
          cacheManager.set(cacheKey, data, 10 * 60 * 1000);
          return data;
        },
        null, // Fallback
        1 // Max retries
      );
    });
  }

  // Background job to refresh analytics
  async refreshAnalytics() {
    return withErrorRecovery(
      async () => {
        const { error } = await supabase.functions.invoke('analytics-optimizer', {
          body: { action: 'refresh_all_analytics' }
        });

        if (error) throw error;
        
        // Clear related caches
        cacheManager.clear();
        
        return { success: true };
      },
      { success: false },
      1
    );
  }

  // Queue background job
  async queueBackgroundJob(jobType: string, jobData?: any, priority?: number) {
    return withErrorRecovery(
      async () => {
        const { data, error } = await supabase.functions.invoke('background-job-processor', {
          body: { 
            action: 'queue_job',
            job_type: jobType,
            job_data: jobData,
            priority: priority
          }
        });

        if (error) throw error;
        return data;
      },
      null,
      1
    );
  }

  // Process next background job
  async processBackgroundJob() {
    return withErrorRecovery(
      async () => {
        const { data, error } = await supabase.functions.invoke('background-job-processor', {
          body: { action: 'process_next' }
        });

        if (error) throw error;
        return data;
      },
      null,
      1
    );
  }

  // Debounced search
  static debouncedSearch = PerformanceOptimizer.debounce(
    async (query: string, callback: (results: any) => void) => {
      const api = MarketplaceAPI.getInstance();
      const data = await api.getMarketplaceData();
      
      const filteredServices = data.services.filter(service =>
        service.title.toLowerCase().includes(query.toLowerCase()) ||
        service.description.toLowerCase().includes(query.toLowerCase())
      );

      const filteredVendors = data.vendors.filter(vendor =>
        vendor.name.toLowerCase().includes(query.toLowerCase()) ||
        vendor.description.toLowerCase().includes(query.toLowerCase())
      );

      callback({ services: filteredServices, vendors: filteredVendors });
    },
    300 // 300ms debounce
  );

  // Track service view with throttling
  static trackServiceView = PerformanceOptimizer.throttle(
    async (serviceId: string) => {
      try {
        await supabase.from('service_views').insert({
          service_id: serviceId,
          user_id: (await supabase.auth.getUser()).data.user?.id || null,
          user_agent: navigator.userAgent,
          referrer_url: document.referrer || null
        });
      } catch (error) {
        console.error('Error tracking service view:', error);
      }
    },
    1000 // 1 second throttle per service
  );
}

export const marketplaceAPI = MarketplaceAPI.getInstance();