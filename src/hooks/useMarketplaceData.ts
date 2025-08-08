/**
 * Optimized Marketplace Data Hook
 * Combines React Query with request deduplication and caching
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { performanceMonitor } from '@/utils/performanceMonitor';

export interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  discount_percentage?: string;
  retail_price?: string;
  pro_price?: string;
  co_pay_price?: string;
  price_duration?: string; // Added missing field
  image_url?: string;
  tags?: string[];
  is_featured: boolean;
  is_top_pick: boolean;
  is_verified?: boolean;
  estimated_roi?: number;
  duration?: string;
  requires_quote?: boolean;
  // Direct purchase feature - vendor controlled
  direct_purchase_enabled?: boolean;
  // Co-pay and RESPA related fields
  copay_allowed?: boolean;
  respa_split_limit?: number; // RESPA compliance split limit
  max_split_percentage_non_ssp?: number;
  estimated_agent_split_percentage?: number;
  respa_category?: string;
  respa_notes?: string;
  vendor: {
    id?: string; // Added missing id field
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

// Helper: timeout wrapper
const withTimeout = async <T,>(promise: PromiseLike<T>, ms = 12000, label?: string): Promise<T> => {
  let timer: number | undefined;
  return Promise.race<T>([
    promise as Promise<T>,
    new Promise<T>((_, reject) => {
      timer = window.setTimeout(() => reject(new Error(`Request timed out${label ? `: ${label}` : ''}`)), ms);
    }),
  ]).finally(() => {
    if (timer) window.clearTimeout(timer);
  });
};

/**
 * Fetch services - with timeout and perf tracking
 */
const fetchServices = async (): Promise<Service[]> => {
  const t0 = performance.now();
  logger.log('🔄 Fetching services from Supabase...');
  const { data, error } = await withTimeout<any>(
    supabase
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(100)
      .then((res) => res),
    12000,
    'fetchServices'
  );

  const duration = performance.now() - t0;
  performanceMonitor.trackRequest('/services', 'SELECT', duration, !error, false);

  if (error) throw error;

  const formattedServices = (data || []).map((service) => ({
    ...service,
    discount_percentage: service.discount_percentage ? String(service.discount_percentage) : undefined,
    is_verified: service.is_verified || false,
    vendor: {
      name: 'Service Provider',
      rating: 4.5,
      review_count: 0,
      is_verified: true,
    },
  }));

  return formattedServices as unknown as Service[];
};

/**
 * Fetch vendors - with timeout and perf tracking
 */
const fetchVendors = async (): Promise<Vendor[]> => {
  const t0 = performance.now();
  logger.log('🔄 Fetching vendors from Supabase...');
  const { data, error } = await withTimeout<any>(
    supabase
      .from('vendors')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('rating', { ascending: false })
      .limit(50)
      .then((res) => res),
    12000,
    'fetchVendors'
  );

  const duration = performance.now() - t0;
  performanceMonitor.trackRequest('/vendors', 'SELECT', duration, !error, false);

  if (error) throw error;

  const formattedVendors = (data || []).map((vendor) => ({
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
    local_representatives: [],
  }));

  return formattedVendors as unknown as Vendor[];
};

/**
 * Fetch combined marketplace data with database cache integration + timeout
 */
const fetchCombinedMarketplaceData = async (): Promise<MarketplaceData> => {
  const overallStart = performance.now();
  logger.log('🔄 Fetching combined marketplace data...');

  // Try to get from database cache first
  try {
    const t0 = performance.now();
    const { data: cacheData } = await withTimeout<any>(
      supabase
        .from('marketplace_cache')
        .select('cache_data')
        .eq('cache_key', 'marketplace_data')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()
        .then((res) => res),
      4000,
      'marketplace_cache'
    );
    performanceMonitor.trackRequest('/marketplace_cache', 'SELECT', performance.now() - t0, true, true);

    if (cacheData?.cache_data && typeof cacheData.cache_data === 'object') {
      logger.log('✅ Retrieved marketplace data from database cache');
      return cacheData.cache_data as unknown as MarketplaceData;
    }
  } catch (error) {
    logger.log('No valid database cache found, fetching fresh data...');
  }

  // Use Promise.all for parallel fetching with timeouts
  const [services, vendors] = await Promise.all([fetchServices(), fetchVendors()]);

  const data = { services, vendors };

  // Warm the cache in background (don't block)
  try {
    const t1 = performance.now();
    await withTimeout(supabase.functions.invoke('warm-marketplace-cache'), 4000, 'warm-marketplace-cache');
    performanceMonitor.trackRequest('/functions/warm-marketplace-cache', 'INVOKE', performance.now() - t1, true, false);
  } catch (error) {
    logger.log('Cache warming failed:', error);
  }

  performanceMonitor.track('fetchCombinedMarketplaceData', performance.now() - overallStart, {
    services: services.length,
    vendors: vendors.length,
  });

  return data;
};

/**
 * Fetch saved services for a user
 */
const fetchSavedServices = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('saved_services')
    .select('service_id')
    .eq('user_id', userId);
  
  if (error) throw error;
  
  return data?.map(item => item.service_id) || [];
};

/**
 * Hook for combined marketplace data (recommended)
 */
export const useMarketplaceData = () => {
  const { toast } = useToast();
  
  const query = useQuery({
    queryKey: QUERY_KEYS.marketplaceCombined,
    queryFn: fetchCombinedMarketplaceData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 1000,
    meta: {
      errorMessage: 'Failed to load marketplace data'
    }
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
    },
    invalidateServices: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services });
    },
    invalidateVendors: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendors });
    },
    invalidateUserData: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.savedServices(userId) });
    }
  };
};
