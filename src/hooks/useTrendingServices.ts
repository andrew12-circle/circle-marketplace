import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

interface TrendingCache {
  data: TrendingService[];
  timestamp: number;
  expiresAt: number;
}

interface BestsellerCache {
  data: BestsellerService[];
  timestamp: number;
  expiresAt: number;
}

// Cache with 15-minute expiry
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in ms
const trendingCache = new Map<string, TrendingCache>();
const bestsellerCache = new Map<string, BestsellerCache>();

export const useTrendingServices = (
  period: '7d' | '30d' = '7d',
  topPct: number = 0.15
) => {
  const [trendingServices, setTrendingServices] = useState<TrendingService[]>([]);
  const [bestsellerServices, setBestsellerServices] = useState<BestsellerService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trendingCacheKey = `trending_${period}_${topPct}`;
  const bestsellerCacheKey = `bestseller_${period}_0.10`; // Fixed 10% for bestsellers

  const loadTrendingServices = useCallback(async () => {
    // Check trending cache first
    const cachedTrending = trendingCache.get(trendingCacheKey);
    if (cachedTrending && Date.now() < cachedTrending.expiresAt) {
      setTrendingServices(cachedTrending.data);
    }

    // Check bestseller cache
    const cachedBestseller = bestsellerCache.get(bestsellerCacheKey);
    if (cachedBestseller && Date.now() < cachedBestseller.expiresAt) {
      setBestsellerServices(cachedBestseller.data);
    }

    // If both caches are valid, no need to load
    if (cachedTrending && Date.now() < cachedTrending.expiresAt &&
        cachedBestseller && Date.now() < cachedBestseller.expiresAt) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load trending and bestseller data in parallel
      const [trendingResult, bestsellerResult] = await Promise.all([
        supabase.rpc('get_trending_services', {
          p_period: period,
          p_top_pct: topPct,
          p_min_count: 8,
          p_max_count: 40
        }),
        supabase.rpc('get_bestseller_services', {
          p_period: period,
          p_top_pct: 0.10, // Top 10% for bestsellers
          p_min_count: 5,
          p_max_count: 25
        })
      ]);

      if (trendingResult.error) {
        console.error('Error fetching trending services:', trendingResult.error);
      } else {
        const trending = trendingResult.data || [];
        setTrendingServices(trending);
        trendingCache.set(trendingCacheKey, {
          data: trending,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_DURATION
        });
      }

      if (bestsellerResult.error) {
        console.error('Error fetching bestseller services:', bestsellerResult.error);
      } else {
        const bestsellers = bestsellerResult.data || [];
        setBestsellerServices(bestsellers);
        bestsellerCache.set(bestsellerCacheKey, {
          data: bestsellers,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_DURATION
        });
      }

      if (trendingResult.error && bestsellerResult.error) {
        setError('Failed to fetch trending and bestseller services');
      }
    } catch (err) {
      console.error('Error loading services:', err);
      setError('Failed to load trending services');
    } finally {
      setIsLoading(false);
    }
  }, [period, topPct, trendingCacheKey, bestsellerCacheKey]);

  // Auto-load on mount
  useEffect(() => {
    loadTrendingServices();
  }, [loadTrendingServices]);

  // Create efficient lookups
  const trendingIds = useMemo(() => {
    return new Set(trendingServices.map(service => service.service_id));
  }, [trendingServices]);

  const bestsellerIds = useMemo(() => {
    return new Set(bestsellerServices.map(service => service.service_id));
  }, [bestsellerServices]);

  const isTrending = useCallback((serviceId: string) => {
    return trendingIds.has(serviceId);
  }, [trendingIds]);

  const isBestseller = useCallback((serviceId: string) => {
    return bestsellerIds.has(serviceId);
  }, [bestsellerIds]);

  const getTrendingData = useCallback((serviceId: string) => {
    return trendingServices.find(service => service.service_id === serviceId);
  }, [trendingServices]);

  const getBestsellerData = useCallback((serviceId: string) => {
    return bestsellerServices.find(service => service.service_id === serviceId);
  }, [bestsellerServices]);

  const refresh = useCallback(() => {
    // Clear caches and reload
    trendingCache.delete(trendingCacheKey);
    bestsellerCache.delete(bestsellerCacheKey);
    loadTrendingServices();
  }, [trendingCacheKey, bestsellerCacheKey, loadTrendingServices]);

  return {
    trendingServices,
    bestsellerServices,
    trendingIds,
    bestsellerIds,
    isTrending,
    isBestseller,
    getTrendingData,
    getBestsellerData,
    isLoading,
    error,
    refresh
  };
};