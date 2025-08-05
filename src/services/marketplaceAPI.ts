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

  // Optimized marketplace data loading using database function
  async getMarketplaceData(): Promise<{ services: Service[]; vendors: Vendor[] }> {
    const cacheKey = 'marketplace-data-optimized-v2';
    
    return PerformanceOptimizer.deduplicateRequest(cacheKey, async () => {
      // Check cache first
      const cachedData = cacheManager.get(cacheKey);
      if (cachedData) {
        console.log('Loading marketplace data from cache...');
        return cachedData;
      }

      console.log('Loading marketplace data using optimized database function...');

      return withErrorRecovery(
        async () => {
          // Use optimized database function with longer timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database query timeout after 30 seconds')), 30000);
          });

          console.log('Calling optimized marketplace function...');
          
          // Call the optimized database function
          const { data: marketplaceData, error: marketplaceError } = await Promise.race([
            supabase.rpc('get_optimized_marketplace_data'),
            timeoutPromise
          ]) as any;
          
          if (marketplaceError) {
            console.error('Error calling marketplace function:', marketplaceError);
            // Fallback to direct queries with shorter timeout
            return this.getFallbackMarketplaceData();
          }

          // Process the optimized data
          const services = (marketplaceData || []).map((row: any) => ({
            id: row.service_id,
            title: row.service_title,
            description: row.service_description,
            category: row.service_category,
            discount_percentage: row.service_discount_percentage,
            retail_price: row.service_retail_price,
            pro_price: row.service_pro_price,
            co_pay_price: row.service_co_pay_price,
            image_url: row.service_image_url,
            tags: row.service_tags,
            is_featured: row.service_is_featured,
            is_top_pick: row.service_is_top_pick,
            estimated_roi: row.service_estimated_roi,
            duration: row.service_duration,
            requires_quote: row.service_requires_quote,
            vendor: {
              name: row.vendor_name,
              rating: row.vendor_rating,
              review_count: row.vendor_review_count,
              is_verified: row.vendor_is_verified
            }
          }));

          // Get unique vendors from the service data
          const vendorMap = new Map();
          marketplaceData?.forEach((row: any) => {
            if (row.vendor_id && !vendorMap.has(row.vendor_id)) {
              vendorMap.set(row.vendor_id, {
                id: row.vendor_id,
                name: row.vendor_name,
                description: row.vendor_description,
                logo_url: row.vendor_logo_url,
                website_url: row.vendor_website_url,
                location: row.vendor_location,
                rating: row.vendor_rating,
                review_count: row.vendor_review_count,
                is_verified: row.vendor_is_verified,
                co_marketing_agents: row.vendor_co_marketing_agents,
                campaigns_funded: row.vendor_campaigns_funded,
                service_states: row.vendor_service_states,
                mls_areas: row.vendor_mls_areas,
                service_radius_miles: row.vendor_service_radius_miles,
                license_states: row.vendor_license_states,
                latitude: row.vendor_latitude,
                longitude: row.vendor_longitude,
                vendor_type: row.vendor_type,
                local_representatives: row.vendor_local_representatives
              });
            }
          });

          const vendors = Array.from(vendorMap.values());

          const result = { services, vendors };

          console.log('Optimized DB function result:', { 
            services: result.services.length, 
            vendors: result.vendors.length,
            servicesWithNullVendor: result.services.filter(s => !s.vendor.name || s.vendor.name === 'Circle Marketplace').length
          });

          // Cache the result for 10 minutes
          cacheManager.set(cacheKey, result, 10 * 60 * 1000);
          
          return result;
        },
        { services: [], vendors: [] }, // Fallback
        1 // Max retries
      );
    });
  }

  // Fallback method for direct queries
  private async getFallbackMarketplaceData(): Promise<{ services: Service[]; vendors: Vendor[] }> {
    console.log('Using fallback marketplace data loading...');
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Fallback query timeout')), 15000);
    });

    // Fetch vendors with pagination
    const { data: vendorsData, error: vendorsError } = await Promise.race([
      supabase.from('vendors').select('*').limit(100),
      timeoutPromise
    ]) as any;
    
    if (vendorsError) {
      console.error('Error fetching vendors in fallback:', vendorsError);
    }

    // Fetch services with basic vendor info
    const { data: servicesData, error: servicesError } = await Promise.race([
      supabase
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
        .limit(100),
      timeoutPromise
    ]) as any;

    if (servicesError) {
      console.error('Error fetching services in fallback:', servicesError);
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

    return {
      services: processedServices,
      vendors: vendorsData || []
    };
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