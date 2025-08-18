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

interface TrendingCache {
  data: TrendingService[];
  timestamp: number;
  expiresAt: number;
}

// Cache with 15-minute expiry
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in ms
const cache = new Map<string, TrendingCache>();

export const useTrendingServices = (
  period: '7d' | '30d' = '7d',
  topPct: number = 0.15
) => {
  const [trendingServices, setTrendingServices] = useState<TrendingService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `${period}_${topPct}`;

  const loadTrendingServices = useCallback(async () => {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      setTrendingServices(cached.data);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('get_trending_services', {
        p_period: period,
        p_top_pct: topPct,
        p_min_count: 8,
        p_max_count: 40
      });

      if (rpcError) {
        console.error('Error fetching trending services:', rpcError);
        setError('Failed to fetch trending services');
        return;
      }

      const services = data || [];
      setTrendingServices(services);

      // Update cache
      cache.set(cacheKey, {
        data: services,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_DURATION
      });
    } catch (err) {
      console.error('Error loading trending services:', err);
      setError('Failed to load trending services');
    } finally {
      setIsLoading(false);
    }
  }, [period, topPct, cacheKey]);

  // Auto-load on mount
  useEffect(() => {
    loadTrendingServices();
  }, [loadTrendingServices]);

  // Create efficient lookups
  const trendingIds = useMemo(() => {
    return new Set(trendingServices.map(service => service.service_id));
  }, [trendingServices]);

  const isTrending = useCallback((serviceId: string) => {
    return trendingIds.has(serviceId);
  }, [trendingIds]);

  const getTrendingData = useCallback((serviceId: string) => {
    return trendingServices.find(service => service.service_id === serviceId);
  }, [trendingServices]);

  const refresh = useCallback(() => {
    // Clear cache and reload
    cache.delete(cacheKey);
    loadTrendingServices();
  }, [cacheKey, loadTrendingServices]);

  return {
    trendingServices,
    trendingIds,
    isTrending,
    getTrendingData,
    isLoading,
    error,
    refresh
  };
};