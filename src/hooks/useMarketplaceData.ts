// @ts-nocheck
/**
 * Optimized Marketplace Data Hook
 * Combines React Query with request deduplication and caching
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { reportClientError } from '@/utils/errorReporting';
import { marketplaceCircuitBreaker, CircuitBreakerState } from '@/utils/circuitBreaker';

export interface Service {
  id: string;
  title: string;
  title_es?: string;
  title_fr?: string;
  description: string;
  description_es?: string;
  description_fr?: string;
  category: string;
  discount_percentage?: string;
  retail_price?: string;
  pro_price?: string;
  co_pay_price?: string;
  price_duration?: string; // Added missing field
  image_url?: string;
  profile_image_url?: string;
  tags?: string[];
  is_featured: boolean;
  is_top_pick: boolean;
  is_verified?: boolean;
  estimated_roi?: number;
  duration?: string;
  requires_quote?: boolean;
  // Direct purchase feature - vendor controlled
  direct_purchase_enabled?: boolean;
  website_url?: string;
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
    website_url?: string;
    logo_url?: string;
    support_hours?: string;
    contact_email?: string; // Add contact email for upvote validation
  } | null;
}

export interface Vendor {
  id: string;
  name: string;
  name_es?: string;
  name_fr?: string;
  description: string;
  description_es?: string;
  description_fr?: string;
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

// Helper: timeout wrapper with retry for auth issues
const withTimeout = async <T,>(promise: PromiseLike<T>, ms = 15000, label?: string): Promise<T> => {
  let timer: number | undefined;
  
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(`Request timed out${label ? `: ${label}` : ''}`)), ms);
  });
  
  try {
    const result = await Promise.race<T>([
      promise as Promise<T>,
      timeoutPromise,
    ]);
    return result;
  } catch (error: any) {
    // Handle auth errors by refreshing session
    if (error?.message?.includes('JWT') || error?.message?.includes('auth') || error?.message?.includes('401')) {
      try {
        await supabase.auth.refreshSession();
        // Retry the original promise once after auth refresh
        return await Promise.race<T>([
          promise as Promise<T>,
          new Promise<T>((_, reject) => {
            setTimeout(() => reject(new Error(`Retry timed out${label ? `: ${label}` : ''}`)), ms);
          }),
        ]);
      } catch (retryError) {
        throw error; // Throw original error if retry fails
      }
    }
    throw error;
  } finally {
    if (timer) window.clearTimeout(timer);
  }
};

/**
 * Fetch services - optimized with better query and error handling
 */
const fetchServices = async (): Promise<Service[]> => {
  const t0 = performance.now();
  logger.log('🔄 Fetching services from Supabase...');
  
  // First, get total count for monitoring
  let totalCount = 0;
  try {
    const { count, error } = await withTimeout(
      supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true), // Apply same filter as main query
      10000,
      'services-count'
    );
    if (!error && typeof count === 'number') {
      totalCount = count;
    }
  } catch (_e) {
    // Non-blocking: count fetch timed out or failed
  }
  
  // Fetch services with optimized query
  const { data, error } = await withTimeout(
    supabase
      .from('services')
      .select('*, title_es, title_fr, description_es, description_fr')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(200), // Reasonable limit for performance
      15000, // Reduced timeout for faster failures
      'fetchServices'
    );

  const duration = performance.now() - t0;
  performanceMonitor.trackRequest('/services', 'SELECT', duration, !error, false);

  if (error) {
    logger.error('Services query error:', error);
    throw new Error(`Failed to fetch services: ${error.message}`);
  }

  const formattedServices = (data || []).map((service: any) => {
    // Parse pricing_tiers if it's a JSON string
    let pricing_tiers = service.pricing_tiers;
    if (typeof pricing_tiers === 'string') {
      try {
        pricing_tiers = JSON.parse(pricing_tiers);
      } catch (e) {
        pricing_tiers = null;
      }
    }

    return {
      ...service,
      discount_percentage: service.discount_percentage ? String(service.discount_percentage) : undefined,
      is_verified: service.is_verified || false,
      pricing_tiers: Array.isArray(pricing_tiers) ? pricing_tiers : null,
      vendor: {
        name: 'Circle Platform',
        rating: 5,
        review_count: 0,
        is_verified: true,
        website_url: undefined,
        logo_url: undefined,
        support_hours: 'Business Hours',
        contact_email: undefined,
      },
    };
  });

  // Add monitoring for service count vs total available
  const fetchedCount = formattedServices.length;
  const total = totalCount || 0;
  
  if (total > fetchedCount) {
    logger.log(`⚠️ WARNING: Fetched ${fetchedCount} services but ${total} total available. ${total - fetchedCount} services not shown.`);
    console.warn(`Service fetch limitation: Showing ${fetchedCount} of ${total} total services. Consider increasing the limit or implementing pagination.`);
  }
  
  logger.log(`✅ Fetched ${fetchedCount} of ${total} total services in ${duration}ms`);
  return formattedServices as unknown as Service[];
};

/**
 * Fetch vendors - optimized with better query and error handling
 */
const fetchVendors = async (): Promise<Vendor[]> => {
  const t0 = performance.now();
  logger.log('🔄 Fetching vendors from Supabase...');
  
  // Simplified query - use existing columns only
  const { data, error } = await withTimeout(
    supabase
      .from('vendors')
      .select('*, name_es, name_fr, description_es, description_fr')
      .eq('is_active', true)
      .in('approval_status', ['approved', 'auto_approved', 'pending'])
      .order('sort_order', { ascending: true })
      .order('rating', { ascending: false })
      .limit(20), // Reduced limit for faster queries
      15000, // Reduced timeout to fail faster
      'fetchVendors'
    );

  const duration = performance.now() - t0;
  performanceMonitor.trackRequest('/vendors', 'SELECT', duration, !error, false);

  if (error) {
    logger.error('Vendors query error:', error);
    throw new Error(`Failed to fetch vendors: ${error.message}`);
  }

  const formattedVendors = (data || []).map((vendor: any) => ({
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

  logger.log(`✅ Fetched ${formattedVendors.length} vendors in ${duration}ms`);
  return formattedVendors as unknown as Vendor[];
};

/**
 * Fetch combined marketplace data with database cache integration, circuit breaker, and timeout
 */
const fetchCombinedMarketplaceData = async (): Promise<MarketplaceData> => {
  const overallStart = performance.now();
  logger.log('🔄 Fetching combined marketplace data...');

  // Fresh override via URL (?fresh=1) or sessionStorage flag
  let forceFresh = false;
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      forceFresh = params.get('fresh') === '1' || sessionStorage.getItem('forceFreshData') === '1';
      // Clean up one-time flag and URL param
      if (forceFresh) {
        sessionStorage.removeItem('forceFreshData');
        if (params.get('fresh') === '1') {
          params.delete('fresh');
          const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '') + window.location.hash;
          window.history.replaceState({}, '', newUrl);
        }
      }
    } catch (e) {
      // no-op
    }
  }

  // Helper to fetch data - first try edge function, then fallback to direct queries
  const fetchData = async (): Promise<MarketplaceData> => {
    // First try the edge function for reliable public access
    try {
      logger.log('🔍 Trying edge function for marketplace data...');
      const edgeFunctionResult = await withTimeout(
        supabase.functions.invoke('get-marketplace-data'),
        10000, // Increased edge function timeout
        'edge_function'
      );

      if (edgeFunctionResult.data && !edgeFunctionResult.error) {
        logger.log('✅ Using edge function marketplace data');
        return edgeFunctionResult.data;
      }
    } catch (error) {
      logger.warn('⚠️ Edge function fetch failed, falling back to direct queries:', error);
    }

    // Fallback to direct table queries
    const [servicesResult, vendorsResult] = await Promise.allSettled([
      fetchServices(),
      fetchVendors(),
    ]);

    let services: Service[] = [];
    let vendors: Vendor[] = [];

    if (servicesResult.status === 'fulfilled') services = servicesResult.value;
    else {
      logger.error('❌ Services fetch failed:', servicesResult.reason);
      reportClientError({
        error_type: 'network',
        message: servicesResult.reason?.message || 'Services fetch failed',
        component: 'useMarketplaceData',
        section: 'marketplace',
        metadata: { reason: servicesResult.reason }
      });
    }

    if (vendorsResult.status === 'fulfilled') vendors = vendorsResult.value;
    else {
      logger.error('❌ Vendors fetch failed:', vendorsResult.reason);
      reportClientError({
        error_type: 'network',
        message: vendorsResult.reason?.message || 'Vendors fetch failed',
        component: 'useMarketplaceData',
        section: 'marketplace',
        metadata: { reason: vendorsResult.reason }
      });
    }

    if (services.length === 0 && vendors.length === 0) {
      reportClientError({
        error_type: 'network',
        message: 'All marketplace data sources failed',
        component: 'useMarketplaceData',
        section: 'marketplace'
      });
      throw new Error('All marketplace data sources failed');
    }

    const data = { services, vendors };

    performanceMonitor.track('fetchCombinedMarketplaceData', performance.now() - overallStart, {
      services: data.services.length,
      vendors: data.vendors.length,
    });

    return data;
  };

  // If forced fresh, bypass DB cache immediately
  if (forceFresh) {
    logger.log('⚡ Force fresh fetch activated');
    return fetchData();
  }

  // Try database cache unless circuit breaker is OPEN
  const canUseDbCache = marketplaceCircuitBreaker.getState() !== CircuitBreakerState.OPEN;
  if (canUseDbCache) {
    try {
      const t0 = performance.now();
      const { data: cacheData } = await marketplaceCircuitBreaker.execute(async () =>
        await withTimeout(
          supabase
            .from('marketplace_cache')
            .select('cache_data')
            .eq('cache_key', 'marketplace_data')
            .gt('expires_at', new Date().toISOString())
            .maybeSingle(),
          3000,
          'marketplace_cache'
        )
      );
      performanceMonitor.trackRequest('/marketplace_cache', 'SELECT', performance.now() - t0, true, true);
      if (cacheData?.cache_data && typeof cacheData.cache_data === 'object') {
        logger.log('✅ Retrieved marketplace data from database cache');
        return cacheData.cache_data as unknown as MarketplaceData;
      }
    } catch (error) {
      logger.log('⛔ Database cache unavailable, proceeding to live fetch', error);
    }
  } else {
    logger.log('🚫 Skipping DB cache due to circuit breaker OPEN');
  }

  // Fallback to fresh data fetch
  return fetchData();
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
    staleTime: 5 * 60 * 1000, // 5 minutes - longer cache
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    refetchOnWindowFocus: false, // reduce refetch noise
    refetchOnMount: true,       // retry on mount if previous attempt failed/stale
    refetchOnReconnect: true,   // retry when connection restores
    retry: (failureCount, error: any) => {
      // Circuit breaker pattern - limit retries but still allow a few
      const isTimeout = typeof error?.message === 'string' && error.message.includes('timed out');
      if (isTimeout) return failureCount < 2; // allow up to 2 retries for timeouts
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    meta: {
      errorMessage: 'Failed to load marketplace data'
    }
  });

  // Stable error handling - only show toast once per error
  const errorShown = useRef(false);
  useEffect(() => {
    if (query.error && !errorShown.current) {
      logger.error('Marketplace data loading error:', query.error);
      reportClientError({
        error_type: 'network',
        message: `Marketplace data loading error: ${query.error.message}`,
        component: 'useMarketplaceData',
        section: 'marketplace'
      });
      toast({
        title: "Error loading data",
        description: `Failed to load marketplace data: ${query.error.message || 'Please try again.'}`,
        variant: "destructive"
      });
      errorShown.current = true;
    }
    
    // Reset error flag when query succeeds
    if (!query.error) {
      errorShown.current = false;
    }
  }, [query.error, toast]);

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
  
  // Stable user ID reference to prevent unnecessary re-queries
  const stableUserId = useMemo(() => profile?.user_id || '', [profile?.user_id]);
  
  const query = useQuery({
    queryKey: QUERY_KEYS.savedServices(stableUserId),
    queryFn: () => fetchSavedServices(stableUserId),
    enabled: !!stableUserId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Stable error handling
  const errorShown = useRef(false);
  useEffect(() => {
    if (query.error && !errorShown.current) {
      logger.error('Error loading saved services:', query.error);
      errorShown.current = true;
    }
    if (!query.error) {
      errorShown.current = false;
    }
  }, [query.error]);

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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.marketplaceCombined });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendors });
    },
    invalidateServices: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.services });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.marketplaceCombined });
    },
    invalidateVendors: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.vendors });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.marketplaceCombined });
    },
    invalidateUserData: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.savedServices(userId) });
    }
  };
};
