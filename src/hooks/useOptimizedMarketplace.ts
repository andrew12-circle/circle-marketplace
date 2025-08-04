// 3. OPTIMIZED MARKETPLACE HOOK: High-performance data management
import { useState, useEffect, useCallback, useMemo } from 'react';
import { marketplaceAPI, Service, Vendor, MarketplaceQueryOptions } from '@/services/marketplaceAPI';
import { useStableLoading } from '@/hooks/useStableState';

export interface UseOptimizedMarketplaceOptions {
  enablePrefetch?: boolean;
  enableAnalytics?: boolean;
  cacheTimeout?: number;
}

export interface OptimizedMarketplaceData {
  services: Service[];
  vendors: Vendor[];
  categories: string[];
  loading: boolean;
  error: string;
  search: (searchTerm: string) => Promise<Service[]>;
  getFilteredServices: (searchTerm?: string) => Service[];
  invalidateCache: () => void;
}

export const useOptimizedMarketplace = (
  filters: MarketplaceQueryOptions = {},
  options: UseOptimizedMarketplaceOptions = {}
): OptimizedMarketplaceData => {
  const [services, setServices] = useState<Service[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoadingStable] = useStableLoading(500);
  const [error, setError] = useState<string>('');

  const {
    enablePrefetch = true,
    enableAnalytics = true,
    cacheTimeout = 5 * 60 * 1000 // 5 minutes
  } = options;

  // Memoized categories to prevent unnecessary re-renders
  const categories = useMemo(() => {
    return Array.from(new Set(services.map(s => s.category).filter(Boolean)));
  }, [services]);

  // Optimized data loading with deduplication
  const loadData = useCallback(async () => {
    try {
      setLoadingStable(true);
      setError('');

      // Load services and vendors in parallel
      const [servicesData, vendorsData] = await Promise.allSettled([
        marketplaceAPI.getServices(filters),
        marketplaceAPI.getVendors(filters)
      ]);

      if (servicesData.status === 'fulfilled') {
        setServices(servicesData.value);
      } else {
        console.error('Services loading failed:', servicesData.reason);
        setError('Failed to load services');
      }

      if (vendorsData.status === 'fulfilled') {
        setVendors(vendorsData.value);
      } else {
        console.error('Vendors loading failed:', vendorsData.reason);
        setError(prev => prev ? `${prev}; Failed to load vendors` : 'Failed to load vendors');
      }

    } catch (err) {
      console.error('Marketplace data loading error:', err);
      setError('Failed to load marketplace data');
    } finally {
      setLoadingStable(false);
    }
  }, [filters, setLoadingStable]);

  // Load data on mount and filter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search function
  const search = useCallback(async (searchTerm: string) => {
    return marketplaceAPI.searchServices(searchTerm, filters);
  }, [filters]);

  // Optimized filtering for client-side operations
  const getFilteredServices = useCallback((searchTerm?: string) => {
    if (!searchTerm) return services;
    
    return services.filter(service => 
      service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services]);

  // Cache management
  const invalidateCache = useCallback(() => {
    marketplaceAPI.clearCache();
    loadData(); // Reload fresh data
  }, [loadData]);

  return {
    services,
    vendors,
    categories,
    loading,
    error,
    search,
    getFilteredServices,
    invalidateCache
  };
};