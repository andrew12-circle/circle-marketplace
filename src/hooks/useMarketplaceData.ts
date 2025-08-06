/**
 * Optimized Marketplace Data Hook
 * Combines React Query with request deduplication and caching
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { requestDeduplicator } from '@/utils/requestDeduplicator';
import { marketplaceCache } from '@/utils/marketplaceCache';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

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

export interface MarketplaceData {
  services: Service[];
  vendors: Vendor[];
}

// Query keys for React Query
export const QUERY_KEYS = {
  marketplace: ['marketplace'],
  marketplaceCombined: ['marketplace', 'combined'],
  services: ['marketplace', 'services'],
  vendors: ['marketplace', 'vendors'],
  savedServices: (userId: string) => ['marketplace', 'savedServices', userId],
} as const;

/**
 * Fetch services with deduplication and caching
 */
const fetchServices = async (): Promise<Service[]> => {
  const cacheKey = 'services:all';
  
  return requestDeduplicator.dedupRequest(
    'services',
    async () => {
      // Check cache first
      const cached = marketplaceCache.get<Service[]>(cacheKey);
      if (cached) return cached;
      
      const startTime = performance.now();
      logger.log('🔄 Fetching services from Supabase...');
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      const formattedServices = (data || []).map(service => ({
        ...service,
        discount_percentage: service.discount_percentage ? String(service.discount_percentage) : undefined,
        vendor: {
          name: 'Service Provider',
          rating: 4.5,
          review_count: 0,
          is_verified: true
        }
      }));
      
      const duration = performance.now() - startTime;
      
      // Cache the result
      marketplaceCache.set(cacheKey, formattedServices);
      performanceMonitor.track('fetch-services', duration, { serviceCount: formattedServices.length });
      performanceMonitor.trackRequest('services', 'GET', duration, true, false, formattedServices.length);
      return formattedServices;
    }
  );
};

/**
 * Fetch vendors with deduplication and caching
 */
const fetchVendors = async (): Promise<Vendor[]> => {
  const cacheKey = 'vendors:all';
  
  return requestDeduplicator.dedupRequest(
    'vendors',
    async () => {
      // Check cache first
      const cached = marketplaceCache.get<Vendor[]>(cacheKey);
      if (cached) return cached;
      
      const startTime = performance.now();
      logger.log('🔄 Fetching vendors from Supabase...');
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('rating', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      const formattedVendors = (data || []).map(vendor => ({
        ...vendor,
        id: vendor.id,
        name: vendor.name || 'Unknown Vendor',
        description: vendor.description || '',
        logo_url: vendor.logo_url,
        website_url: vendor.website_url,
        location: vendor.location,
        rating: vendor.rating || 0,
        review_count: vendor.review_count || 0,
        is_verified: vendor.is_verified || false,
        co_marketing_agents: vendor.co_marketing_agents || 0,
        campaigns_funded: vendor.campaigns_funded || 0,
        service_states: vendor.service_states || [],
        mls_areas: vendor.mls_areas || [],
        service_radius_miles: vendor.service_radius_miles,
        license_states: vendor.license_states || [],
        latitude: vendor.latitude,
        longitude: vendor.longitude,
        vendor_type: vendor.vendor_type || 'company',
        local_representatives: []
      }));
      
      const duration = performance.now() - startTime;
      
      // Cache the result
      marketplaceCache.set(cacheKey, formattedVendors);
      performanceMonitor.track('fetch-vendors', duration, { vendorCount: formattedVendors.length });
      performanceMonitor.trackRequest('vendors', 'GET', duration, true, false, formattedVendors.length);
      return formattedVendors;
    }
  );
};

/**
 * Fetch combined marketplace data (optimized single call)
 */
const fetchCombinedMarketplaceData = async (): Promise<MarketplaceData> => {
  const cacheKey = 'marketplace:combined';
  
  return requestDeduplicator.dedupRequest(
    'marketplace-combined',
    async () => {
      // Check cache first
      const cached = marketplaceCache.get<MarketplaceData>(cacheKey);
      if (cached) return cached;
      
      const startTime = performance.now();
      logger.log('🔄 Fetching combined marketplace data...');
      
      // Use Promise.all for parallel fetching
      const [services, vendors] = await Promise.all([
        fetchServices(),
        fetchVendors()
      ]);
      
      const result = { services, vendors };
      const duration = performance.now() - startTime;
      
      // Cache the combined result
      marketplaceCache.set(cacheKey, result);
      performanceMonitor.track('fetch-combined-marketplace', duration, { serviceCount: services.length, vendorCount: vendors.length });
      return result;
    }
  );
};

/**
 * Fetch saved services for a user
 */
const fetchSavedServices = async (userId: string): Promise<string[]> => {
  const cacheKey = `savedServices:user:${userId}`;
  
  return requestDeduplicator.dedupRequest(
    `saved-services-${userId}`,
    async () => {
      // Check cache first
      const cached = marketplaceCache.get<string[]>(cacheKey);
      if (cached) return cached;
      
      const { data, error } = await supabase
        .from('saved_services')
        .select('service_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const serviceIds = data?.map(item => item.service_id) || [];
      
      // Cache with shorter TTL for user data
      marketplaceCache.set(cacheKey, serviceIds);
      return serviceIds;
    }
  );
};

/**
 * Hook for combined marketplace data (recommended)
 */
export const useMarketplaceData = () => {
  const { toast } = useToast();
  
  const query = useQuery({
    queryKey: QUERY_KEYS.marketplaceCombined,
    queryFn: fetchCombinedMarketplaceData,
    staleTime: 5 * 60 * 1000, // 5 minutes for navigation stability
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Prevent refetch on navigation
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Handle errors with toast
  if (query.error) {
    logger.error('Marketplace data loading error:', query.error);
    toast({
      title: "Error loading data",
      description: `Failed to load marketplace data: ${query.error.message || 'Please try again.'}`,
      variant: "destructive"
    });
  }

  return query;
};

/**
 * Hook for services only - optimized to use combined data
 */
export const useServices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: QUERY_KEYS.services,
    queryFn: async () => {
      // Check if combined data is already loaded
      const combinedData = queryClient.getQueryData<MarketplaceData>(QUERY_KEYS.marketplaceCombined);
      if (combinedData?.services) {
        return combinedData.services;
      }
      
      // Fallback to individual fetch only if combined data isn't available
      return fetchServices();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Stable navigation
    retry: 2,
  });

  // Handle errors with toast
  if (query.error) {
    toast({
      title: "Error loading services",
      description: query.error.message || 'Please try again.',
      variant: "destructive"
    });
  }

  return query;
};

/**
 * Hook for vendors only - optimized to use combined data
 */
export const useVendors = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: QUERY_KEYS.vendors,
    queryFn: async () => {
      // Check if combined data is already loaded
      const combinedData = queryClient.getQueryData<MarketplaceData>(QUERY_KEYS.marketplaceCombined);
      if (combinedData?.vendors) {
        return combinedData.vendors;
      }
      
      // Fallback to individual fetch only if combined data isn't available
      return fetchVendors();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Stable navigation
    retry: 2,
  });

  // Handle errors with toast
  if (query.error) {
    toast({
      title: "Error loading vendors",
      description: query.error.message || 'Please try again.',
      variant: "destructive"
    });
  }

  return query;
};

/**
 * Hook for user's saved services
 */
export const useSavedServices = () => {
  const { profile } = useAuth();
  
  const query = useQuery({
    queryKey: QUERY_KEYS.savedServices(profile?.user_id || ''),
    queryFn: () => fetchSavedServices(profile?.user_id || ''),
    enabled: !!profile?.user_id,
    staleTime: 1 * 60 * 1000,
    gcTime: 3 * 60 * 1000,
  });

  // Handle errors
  if (query.error) {
    logger.error('Error loading saved services:', query.error);
  }

  return query;
};

/**
 * Utility to invalidate marketplace cache
 */
export const useInvalidateMarketplace = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.marketplace });
      marketplaceCache.invalidate();
    },
    invalidateServices: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services });
      marketplaceCache.invalidate('services');
    },
    invalidateVendors: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendors });
      marketplaceCache.invalidate('vendors');
    },
    invalidateUserData: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.savedServices(userId) });
      marketplaceCache.invalidateUserData(userId);
    }
  };
};