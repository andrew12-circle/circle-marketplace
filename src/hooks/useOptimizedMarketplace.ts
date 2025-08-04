import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cacheManager } from '@/utils/cacheManager';
import { PerformanceOptimizer, withErrorRecovery } from '@/utils/performanceOptimizer';
import { useToast } from '@/hooks/use-toast';

interface MarketplaceService {
  id: string;
  title: string;
  description: string;
  category: string;
  retail_price?: string;
  pro_price?: string;
  image_url?: string;
  is_featured: boolean;
  is_top_pick: boolean;
  vendor_id?: string;
}

interface MarketplaceVendor {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  service_states?: string[];
  license_states?: string[];
}

interface UseOptimizedMarketplaceOptions {
  limit?: number;
  category?: string;
  featured?: boolean;
  location?: string;
}

export const useOptimizedMarketplace = (options: UseOptimizedMarketplaceOptions = {}) => {
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [vendors, setVendors] = useState<MarketplaceVendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Memoize cache key to prevent unnecessary recalculations
  const cacheKey = useMemo(() => {
    return `marketplace-optimized-${JSON.stringify(options)}`;
  }, [options]);

  // Debounced data fetcher to prevent excessive API calls
  const debouncedFetch = useMemo(
    () => PerformanceOptimizer.debounce(async () => {
      await loadMarketplaceData();
    }, 300),
    [cacheKey]
  );

  const loadMarketplaceData = useCallback(async () => {
    // Use request deduplication to prevent duplicate API calls
    return PerformanceOptimizer.deduplicateRequest(cacheKey, async () => {
      // Check cache first
      const cachedData = cacheManager.get(cacheKey);
      if (cachedData) {
        console.log('Loading marketplace data from cache:', cacheKey);
        setServices(cachedData.services || []);
        setVendors(cachedData.vendors || []);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Loading marketplace data from database with options:', options);

        // Build optimized queries with proper indexing
        let servicesQuery = supabase
          .from('services')
          .select('id, title, description, category, retail_price, pro_price, image_url, is_featured, is_top_pick, vendor_id')
          .order('sort_order', { ascending: true })
          .order('is_featured', { ascending: false });

        let vendorsQuery = supabase
          .from('vendors')
          .select('id, name, description, logo_url, rating, review_count, is_verified, service_states, license_states')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('rating', { ascending: false });

        // Apply filters using indexed columns
        if (options.category && options.category !== 'all') {
          servicesQuery = servicesQuery.eq('category', options.category);
        }

        if (options.featured) {
          servicesQuery = servicesQuery.eq('is_featured', true);
        }

        if (options.location) {
          vendorsQuery = vendorsQuery.contains('service_states', [options.location]);
        }

        if (options.limit) {
          servicesQuery = servicesQuery.limit(options.limit);
          vendorsQuery = vendorsQuery.limit(options.limit);
        } else {
          // Default limits to prevent large data loads
          servicesQuery = servicesQuery.limit(100);
          vendorsQuery = vendorsQuery.limit(50);
        }

        // Execute queries
        const [servicesResult, vendorsResult] = await Promise.allSettled([
          servicesQuery,
          vendorsQuery
        ]);

        const servicesData = servicesResult.status === 'fulfilled' && servicesResult.value.data ? servicesResult.value.data : [];
        const vendorsData = vendorsResult.status === 'fulfilled' && vendorsResult.value.data ? vendorsResult.value.data : [];

        setServices(servicesData);
        setVendors(vendorsData);

        // Cache the results with shorter TTL for dynamic data
        cacheManager.set(cacheKey, {
          services: servicesData,
          vendors: vendorsData
        }, 5 * 60 * 1000); // 5 minute cache

        console.log(`Loaded ${servicesData.length} services and ${vendorsData.length} vendors`);

      } catch (err) {
        console.error('Error loading marketplace data:', err);
        setError('Failed to load marketplace data');
        toast({
          title: "Loading Error",
          description: "Failed to load marketplace data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    });
  }, [cacheKey, options, toast]);

  // Throttled cache clear function
  const clearCache = useMemo(
    () => PerformanceOptimizer.throttle(() => {
      cacheManager.clear();
      console.log('Marketplace cache cleared');
    }, 1000),
    []
  );

  // Load data when options change
  useEffect(() => {
    debouncedFetch();
  }, [debouncedFetch]);

  // Background refresh for cached data
  useEffect(() => {
    const interval = setInterval(() => {
      const cachedData = cacheManager.get(cacheKey);
      if (cachedData) {
        // Refresh in background without showing loading state
        loadMarketplaceData();
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [cacheKey, loadMarketplaceData]);

  return {
    services,
    vendors,
    loading,
    error,
    refresh: loadMarketplaceData,
    clearCache
  };
};