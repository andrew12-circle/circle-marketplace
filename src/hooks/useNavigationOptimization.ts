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
  const navigationInProgress = useRef<boolean>(false);
  const cleanupTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const currentPath = location.pathname;
    const previousPath = lastLocation.current;

    if (previousPath && previousPath !== currentPath) {
      // Prevent concurrent navigation handling
      if (navigationInProgress.current) {
        logger.log(`🚫 Navigation blocked - already in progress: ${previousPath} → ${currentPath}`);
        return;
      }

      navigationInProgress.current = true;

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

      // Cancel previous queries when leaving admin/heavy pages
      if (previousPath.startsWith('/admin') || 
          previousPath.startsWith('/command-center') ||
          previousPath.startsWith('/analytics')) {
        
        logger.log(`🧹 Cancelling queries from ${previousPath}`);
        queryClient.cancelQueries();
        
        // Add delay before loading marketplace data when coming from admin
        if (currentPath === '/' || currentPath === '/marketplace') {
          cleanupTimer.current = setTimeout(() => {
            optimizeMarketplaceData();
            navigationInProgress.current = false;
          }, 500); // 500ms delay for smooth transition
        } else {
          navigationInProgress.current = false;
        }
        
        cleanupPageSpecificQueries(previousPath);
      } else {
        // Normal navigation - no delay needed
        if (currentPath === '/' || currentPath === '/marketplace') {
          optimizeMarketplaceData();
        }
        navigationInProgress.current = false;
      }
    }

    lastLocation.current = currentPath;

    // Cleanup timer on unmount
    return () => {
      if (cleanupTimer.current) {
        clearTimeout(cleanupTimer.current);
        cleanupTimer.current = null;
      }
    };
  }, [location.pathname, queryClient]);

  const optimizeMarketplaceData = () => {
    // Check if navigation is still in progress to prevent race conditions
    if (navigationInProgress.current) {
      logger.log('⏳ Delaying marketplace optimization - navigation in progress');
      return;
    }

    // Prefetch marketplace data if not already cached
    const marketplaceData = queryClient.getQueryData(QUERY_KEYS.marketplaceCombined);
    
    if (!marketplaceData) {
      logger.log('🔄 Prefetching marketplace data for smooth navigation');
      // Use staggered loading instead of immediate fetch
      setTimeout(() => {
        if (!navigationInProgress.current) {
          queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.marketplaceCombined,
            staleTime: 5 * 60 * 1000,
          });
        }
      }, 100);
    }

    // Warm up marketplace cache with delay
    setTimeout(() => {
      if (!navigationInProgress.current) {
        marketplaceCache.backgroundRefresh('marketplace:combined', async () => {
          const data = queryClient.getQueryData(QUERY_KEYS.marketplaceCombined);
          return data || null;
        });
      }
    }, 200);
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
