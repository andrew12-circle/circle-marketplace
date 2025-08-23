import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTrendingServicesCache } from './useMarketplaceCache';

interface TrendingService {
  service_id: string;
  score: number;
  rank: number;
  views_now: number;
  views_prev: number;
  conv_now: number;
  conv_prev: number;
  bookings_now: number;
  purchases_now: number;
  revenue_now: number;
}

interface BestsellerService {
  service_id: string;
  sales_score: number;
  rank: number;
  total_revenue: number;
  total_purchases: number;
  purchase_velocity: number;
  conversion_rate: number;
  avg_purchase_value: number;
}

// Keep original hook interface but use cache-first approach
export const useTrendingServices = (
  period: '7d' | '30d' = '7d',
  topPct: number = 0.15
) => {
  // Use cache for trending services (main use case)
  const cacheQuery = useTrendingServicesCache();
  
  // Fallback query for bestsellers (less cached)
  const bestsellerQuery = useQuery({
    queryKey: ['bestseller-services', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_bestseller_services', {
          p_period: period,
          p_top_pct: 0.10, // Top 10% for bestsellers
          p_min_count: 5,
          p_max_count: 25
        });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false
  });

  const trendingServices: TrendingService[] = cacheQuery.data || [];
  const bestsellerServices: BestsellerService[] = bestsellerQuery.data || [];

  // Create efficient lookups
  const trendingIds = new Set(trendingServices.map(service => service.service_id));
  const bestsellerIds = new Set(bestsellerServices.map(service => service.service_id));

  const isTrending = (serviceId: string) => trendingIds.has(serviceId);
  const isBestseller = (serviceId: string) => bestsellerIds.has(serviceId);

  const getTrendingData = (serviceId: string) => {
    return trendingServices.find(service => service.service_id === serviceId);
  };

  const getBestsellerData = (serviceId: string) => {
    return bestsellerServices.find(service => service.service_id === serviceId);
  };

  const refresh = () => {
    cacheQuery.refetch();
    bestsellerQuery.refetch();
  };

  return {
    trendingServices,
    bestsellerServices,
    trendingIds,
    bestsellerIds,
    isTrending,
    isBestseller,
    getTrendingData,
    getBestsellerData,
    isLoading: cacheQuery.isLoading || bestsellerQuery.isLoading,
    error: cacheQuery.error || bestsellerQuery.error,
    refresh
  };
};