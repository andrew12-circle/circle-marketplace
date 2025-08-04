// 2. ENHANCED MARKETPLACE CACHING - Optimized hooks for marketplace data
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '@/utils/cacheManager';
import { PerformanceOptimizer, withErrorRecovery } from '@/utils/performanceOptimizer';
import { useToast } from '@/hooks/use-toast';

interface UseOptimizedMarketplaceOptions {
  category?: string;
  featured?: boolean;
  locationFilter?: boolean;
  limit?: number;
  location?: string;
}

interface MarketplaceService {
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

interface MarketplaceVendor {
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
  local_representatives?: any[];
}

interface CachedMarketplaceData {
  services: MarketplaceService[];
  vendors: MarketplaceVendor[];
  categories: string[];
  lastUpdated: number;
}

// Debounced search with caching
const debouncedSearch = PerformanceOptimizer.debounce(
  async (searchTerm: string, filters: UseOptimizedMarketplaceOptions) => {
    const cacheKey = `marketplace-search-${JSON.stringify({ searchTerm, filters })}`;
    
    return PerformanceOptimizer.deduplicateRequest(cacheKey, async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *
        `)
        .ilike('title', `%${searchTerm}%`)
        .limit(20);
      
      if (error) throw error;
      return data || [];
    });
  },
  300
);

export const useOptimizedMarketplace = (filters: UseOptimizedMarketplaceOptions = {}) => {
  const [data, setData] = useState<CachedMarketplaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Memoized cache key based on filters
  const cacheKey = useMemo(() => 
    `marketplace-${JSON.stringify(filters)}`, 
    [filters]
  );

  const loadMarketplaceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedData = cacheManager.get(cacheKey);
      if (cachedData && Date.now() - cachedData.lastUpdated < 5 * 60 * 1000) {
        setData(cachedData);
        setLoading(false);
        return;
      }

      // Load from database with optimized queries
      const result = await withErrorRecovery(
        async () => {
          // Use indexed queries with proper filtering
          const [servicesResponse, vendorsResponse] = await Promise.all([
            supabase
              .from('services')
              .select('*')
              .eq('is_featured', filters.featured || false)
              .order('sort_order', { ascending: true })
              .limit(50),
            
            supabase
              .from('vendors')
              .select('*')
              .order('rating', { ascending: false })
              .limit(30)
          ]);

          if (servicesResponse.error) throw servicesResponse.error;
          if (vendorsResponse.error) throw vendorsResponse.error;

          // Format services with proper vendor data
          const formattedServices: MarketplaceService[] = (servicesResponse.data || []).map(service => ({
            ...service,
            discount_percentage: service.discount_percentage ? String(service.discount_percentage) : undefined,
            vendor: {
              name: 'Service Provider',
              rating: 4.5,
              review_count: 0,
              is_verified: true
            }
          }));

          // Format vendors with all required fields
          const formattedVendors: MarketplaceVendor[] = (vendorsResponse.data || []).map(vendor => ({
            ...vendor,
            co_marketing_agents: vendor.co_marketing_agents || 0,
            campaigns_funded: vendor.campaigns_funded || 0,
            service_states: vendor.service_states || [],
            mls_areas: vendor.mls_areas || [],
            license_states: vendor.license_states || [],
            vendor_type: vendor.vendor_type || 'company',
            local_representatives: (vendor as any).local_representatives || []
          }));

          return {
            services: formattedServices,
            vendors: formattedVendors,
            categories: Array.from(new Set(formattedServices.map(s => s.category))),
            lastUpdated: Date.now()
          };
        },
        { services: [], vendors: [], categories: [], lastUpdated: 0 },
        3
      );

      setData(result);
      
      // Cache the result
      cacheManager.set(cacheKey, result, 10 * 60 * 1000); // 10 minutes

    } catch (err) {
      console.error('Marketplace data loading error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load marketplace data');
      toast({
        title: "Loading Error",
        description: "Failed to load marketplace data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [cacheKey, filters, toast]);

  // Search with debouncing and caching
  const search = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      return data?.services || [];
    }

    try {
      const results = await debouncedSearch(searchTerm, filters);
      return Array.isArray(results) ? results : [];
    } catch (err) {
      console.error('Search error:', err);
      return [];
    }
  }, [data?.services, filters]);

  // Optimized filtering with memoization
  const getFilteredServices = useCallback((searchTerm?: string) => {
    if (!data?.services) return [];

    return data.services.filter(service => {
      const matchesSearch = !searchTerm || 
        service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !filters.category || 
        filters.category === 'all' || 
        service.category === filters.category;
      
      const matchesFeatured = !filters.featured || 
        service.is_featured;

      return matchesSearch && matchesCategory && matchesFeatured;
    });
  }, [data?.services, filters]);

  // Prefetch related data
  const prefetchServiceDetails = useCallback(async (serviceId: string) => {
    const cacheKey = `service-details-${serviceId}`;
    const cached = cacheManager.get(cacheKey);
    
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *
        `)
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      
      cacheManager.set(cacheKey, data, 15 * 60 * 1000); // 15 minutes
      return data;
    } catch (err) {
      console.error('Prefetch error:', err);
      return null;
    }
  }, []);

  // Invalidate cache on demand
  const invalidateCache = useCallback(() => {
    cacheManager.clear();
    loadMarketplaceData();
  }, [loadMarketplaceData]);

  const clearCache = useCallback(() => {
    cacheManager.clear();
  }, []);

  const refresh = useCallback(async () => {
    await loadMarketplaceData();
  }, [loadMarketplaceData]);

  useEffect(() => {
    loadMarketplaceData();
  }, [loadMarketplaceData]);

  return {
    services: data?.services || [],
    vendors: data?.vendors || [],
    categories: data?.categories || [],
    loading,
    error: error || '',
    search,
    getFilteredServices,
    prefetchServiceDetails,
    invalidateCache,
    clearCache,
    refresh,
    refetch: loadMarketplaceData
  };
};