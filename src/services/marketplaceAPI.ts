import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '@/utils/cacheManager';
import { PerformanceOptimizer } from '@/utils/performanceOptimizer';

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
  
  static getInstance(): MarketplaceAPI {
    if (!MarketplaceAPI.instance) {
      MarketplaceAPI.instance = new MarketplaceAPI();
    }
    return MarketplaceAPI.instance;
  }

  // Cached and optimized vendor loading
  async getVendors(options: {
    limit?: number;
    verified?: boolean;
    location?: string;
    forceRefresh?: boolean;
  } = {}): Promise<Vendor[]> {
    const cacheKey = `vendors-${JSON.stringify(options)}`;
    
    // Check cache first unless force refresh
    if (!options.forceRefresh) {
      const cached = cacheManager.get(cacheKey);
      if (cached) {
        console.log('Loading vendors from cache');
        return cached;
      }
    }

    return PerformanceOptimizer.deduplicateRequest(cacheKey, async () => {
      console.log('Loading vendors from database');
      
      let query = supabase
        .from('vendors')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('rating', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.verified) {
        query = query.eq('is_verified', true);
      }

      if (options.location) {
        query = query.or(`service_states.cs.{${options.location}},license_states.cs.{${options.location}}`);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const formattedVendors = (data || []).map(vendor => ({
        ...vendor,
        id: vendor.id,
        name: vendor.name || 'Unknown Vendor',
        description: vendor.description || '',
        rating: vendor.rating || 0,
        review_count: vendor.review_count || 0,
        is_verified: vendor.is_verified || false,
        co_marketing_agents: vendor.co_marketing_agents || 0,
        campaigns_funded: vendor.campaigns_funded || 0,
        service_states: vendor.service_states || [],
        mls_areas: vendor.mls_areas || [],
        license_states: vendor.license_states || [],
        vendor_type: vendor.vendor_type || 'company',
        local_representatives: []
      }));

      // Cache for 10 minutes
      cacheManager.set(cacheKey, formattedVendors, 10 * 60 * 1000);
      
      return formattedVendors;
    });
  }

  // Cached and optimized service loading
  async getServices(options: {
    limit?: number;
    category?: string;
    featured?: boolean;
    forceRefresh?: boolean;
  } = {}): Promise<Service[]> {
    const cacheKey = `services-${JSON.stringify(options)}`;
    
    // Check cache first unless force refresh
    if (!options.forceRefresh) {
      const cached = cacheManager.get(cacheKey);
      if (cached) {
        console.log('Loading services from cache');
        return cached;
      }
    }

    return PerformanceOptimizer.deduplicateRequest(cacheKey, async () => {
      console.log('Loading services from database');
      
      let query = supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.category && options.category !== 'all') {
        query = query.eq('category', options.category);
      }

      if (options.featured) {
        query = query.eq('is_featured', true);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const formattedServices = (data || []).map(service => ({
        ...service,
        is_top_pick: service.is_top_pick || false, // Ensure this field exists
        discount_percentage: service.discount_percentage ? String(service.discount_percentage) : undefined,
        vendor: {
          name: 'Service Provider',
          rating: 4.5,
          review_count: 0,
          is_verified: true
        }
      }));

      // Cache for 5 minutes
      cacheManager.set(cacheKey, formattedServices, 5 * 60 * 1000);
      
      return formattedServices;
    });
  }

  // Queue heavy operations
  async queueBackgroundJob(jobType: string, jobData: any = {}, priority: number = 5): Promise<void> {
    try {
      const { error } = await supabase
        .from('background_jobs')
        .insert({
          job_type: jobType,
          job_data: jobData,
          priority: priority
        });

      if (error) throw error;
      
      console.log(`Queued background job: ${jobType}`);
    } catch (error) {
      console.error('Error queueing background job:', error);
    }
  }

  // Clear marketplace cache
  clearCache(): void {
    console.log('Clearing marketplace cache');
    cacheManager.clear();
    
    // Trigger cache refresh event
    window.dispatchEvent(new CustomEvent('clearCache'));
  }

  // Preload critical data
  async preloadData(): Promise<void> {
    console.log('Preloading marketplace data');
    
    // Load essential data in parallel
    await Promise.allSettled([
      this.getServices({ limit: 50, featured: true }),
      this.getVendors({ limit: 30, verified: true })
    ]);
  }

  // Track analytics without blocking
  async trackServiceView(serviceId: string): Promise<void> {
    // Use fire-and-forget for analytics
    PerformanceOptimizer.debounce(async () => {
      try {
        await supabase
          .from('service_views')
          .insert({
            service_id: serviceId,
            viewed_at: new Date().toISOString()
          });
      } catch (error) {
        console.error('Analytics tracking failed:', error);
      }
    }, 1000)();
  }
}

export const marketplaceAPI = MarketplaceAPI.getInstance();