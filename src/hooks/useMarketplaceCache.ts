import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CachedData {
  services?: any[];
  vendors?: any[];
}

export const useMarketplaceCache = (cacheKey: string, fallbackFn?: () => Promise<any>, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['marketplace-cache', cacheKey],
    queryFn: async (): Promise<any> => {
      try {
        // Try to get cached data first
        const { data: cachedData, error: cacheError } = await supabase
          .rpc('get_marketplace_cache', { p_cache_key: cacheKey });

        if (!cacheError && cachedData && cachedData !== null) {
          return cachedData;
        }

        // If no cache or error, fall back to direct fetch
        if (fallbackFn) {
          const freshData = await fallbackFn();
          
          // Try to warm cache in background (don't wait)
          supabase.functions.invoke('warm-marketplace-cache').catch(console.warn);
          
          return freshData;
        }

        return null;
      } catch (error) {
        console.warn('Cache lookup failed, using fallback:', error);
        
        if (fallbackFn) {
          return await fallbackFn();
        }
        
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled,
    retry: 2,
    refetchOnWindowFocus: false
  });
};

export const useTrendingServicesCache = () => {
  return useMarketplaceCache(
    'trending_services_7d',
    async () => {
      const { data, error } = await supabase
        .rpc('get_trending_services', { 
          p_period: '7d', 
          p_top_pct: 0.15, 
          p_min_count: 8, 
          p_max_count: 40 
        });
      
      if (error) throw error;
      return data || [];
    }
  );
};

export const useVendorsCache = () => {
  return useMarketplaceCache(
    'active_vendors',
    async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, auto_score, co_marketing_agents, is_verified, circle_commission_percentage, sort_order')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .order('sort_order')
        .order('auto_score', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    }
  );
};