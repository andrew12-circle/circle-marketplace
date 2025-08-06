/**
 * Navigation Optimization Hook
 * Prevents marketplace from getting stuck during navigation
 */

import { useEffect, useRef } from 'react';
import { useLocation as useRouterLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { marketplaceCache } from '@/utils/marketplaceCache';
import { QUERY_KEYS } from '@/hooks/useMarketplaceData';

interface NavigationEvent {
  from: string;
  to: string;
  timestamp: number;
}

export const useNavigationOptimization = () => {
  const location = useRouterLocation();
  const queryClient = useQueryClient();
  const navigationHistory = useRef<NavigationEvent[]>([]);
  const lastLocation = useRef<string>('');

  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = lastLocation.current;

    if (previousPath && previousPath !== currentPath) {
      const navigationEvent: NavigationEvent = {
        from: previousPath,
        to: currentPath,
        timestamp: Date.now()
      };

      navigationHistory.current.push(navigationEvent);
      
      // Keep only last 10 navigation events
      if (navigationHistory.current.length > 10) {
        navigationHistory.current = navigationHistory.current.slice(-10);
      }

      logger.log(`🧭 Navigation: ${previousPath} → ${currentPath}`);

      // Optimize for marketplace navigation
      if (currentPath === '/' || currentPath === '/marketplace') {
        optimizeMarketplaceData();
      }

      // Clean up unnecessary queries when leaving certain pages
      if (previousPath.startsWith('/command-center') || 
          previousPath.startsWith('/analytics') ||
          previousPath.startsWith('/admin')) {
        cleanupPageSpecificQueries(previousPath);
      }
    }

    lastLocation.current = currentPath;
  }, [location.pathname, queryClient]);

  const optimizeMarketplaceData = () => {
    // Prefetch marketplace data if not already cached
    const marketplaceData = queryClient.getQueryData(QUERY_KEYS.marketplaceCombined);
    
    if (!marketplaceData) {
      logger.log('🔄 Prefetching marketplace data for smooth navigation');
      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.marketplaceCombined,
        staleTime: 5 * 60 * 1000,
      });
    }

    // Warm up marketplace cache
    marketplaceCache.backgroundRefresh('marketplace:combined', async () => {
      const data = queryClient.getQueryData(QUERY_KEYS.marketplaceCombined);
      return data || null;
    });
  };

  const cleanupPageSpecificQueries = (path: string) => {
    // Remove stale queries that are page-specific
    if (path.startsWith('/command-center')) {
      queryClient.removeQueries({ 
        queryKey: ['agent-data'],
        exact: false 
      });
    }
    
    if (path.startsWith('/analytics')) {
      queryClient.removeQueries({ 
        queryKey: ['analytics'],
        exact: false 
      });
    }
  };

  const getNavigationMetrics = () => {
    const recentNavigations = navigationHistory.current.slice(-5);
    const averageNavigationTime = recentNavigations.length > 1 
      ? (recentNavigations[recentNavigations.length - 1].timestamp - recentNavigations[0].timestamp) / (recentNavigations.length - 1)
      : 0;

    return {
      recentNavigations,
      averageNavigationTime,
      totalNavigations: navigationHistory.current.length
    };
  };

  return {
    navigationHistory: navigationHistory.current,
    getNavigationMetrics,
    optimizeMarketplaceData,
  };
};
