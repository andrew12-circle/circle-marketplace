// Optimized marketplace hook using API abstraction
import { useState, useEffect, useCallback } from 'react';
import { marketplaceAPI, Service, Vendor } from '@/services/marketplaceAPI';
import { useToast } from '@/hooks/use-toast';
import { useStableLoading } from '@/hooks/useStableState';

interface UseOptimizedMarketplaceOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const useOptimizedMarketplace = (options: UseOptimizedMarketplaceOptions = {}) => {
  const { autoRefresh = false, refreshInterval = 5 * 60 * 1000 } = options;
  
  const [services, setServices] = useState<Service[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoadingStable] = useStableLoading(500);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoadingStable(true);
      setError(null);
      
      console.log('Loading optimized marketplace data...');
      
      // Add additional timeout at hook level
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Marketplace loading timeout after 15 seconds')), 15000);
      });
      
      const dataPromise = marketplaceAPI.getMarketplaceData();
      
      const data = await Promise.race([dataPromise, timeoutPromise]) as any;
      
      console.log('Raw data loaded:', { 
        services: data.services.length, 
        vendors: data.vendors.length,
        servicesWithNullVendor: data.services.filter((s: any) => !s.vendor_id).length
      });
      
      setServices(data.services);
      setVendors(data.vendors);
      
      console.log(`Successfully loaded ${data.services.length} services and ${data.vendors.length} vendors`);
      
    } catch (error) {
      console.error('Optimized marketplace loading error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load marketplace data';
      setError(errorMessage);
      
      // Show user-friendly error message
      toast({
        title: "Unable to load marketplace",
        description: "Please refresh the page to try again. If the problem persists, contact support.",
        variant: "destructive"
      });
      
      // Set empty arrays as fallback to prevent infinite loading
      setServices([]);
      setVendors([]);
    } finally {
      setLoadingStable(false);
    }
  }, [toast, setLoadingStable]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      console.log('Auto-refreshing marketplace data...');
      loadData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadData]);

  // Refresh analytics in background
  const refreshAnalytics = useCallback(async () => {
    try {
      await marketplaceAPI.refreshAnalytics();
      toast({
        title: "Analytics refresh queued",
        description: "Analytics will be updated in the background."
      });
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      toast({
        title: "Error",
        description: "Failed to queue analytics refresh.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Search with debouncing
  const search = useCallback((query: string, callback: (results: any) => void) => {
    (marketplaceAPI.constructor as any).debouncedSearch(query, callback);
  }, []);

  // Track service view with throttling
  const trackView = useCallback((serviceId: string) => {
    (marketplaceAPI.constructor as any).trackServiceView(serviceId);
  }, []);

  return {
    services,
    vendors,
    loading,
    error,
    refetch: loadData,
    refreshAnalytics,
    search,
    trackView
  };
};