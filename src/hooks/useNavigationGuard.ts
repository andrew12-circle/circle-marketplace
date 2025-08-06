/**
 * Navigation Guard Hook
 * Manages loading states and prevents race conditions during navigation
 */

import { useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { requestDeduplicator } from '@/utils/requestDeduplicator';
import { logger } from '@/utils/logger';

interface NavigationGuardState {
  isNavigating: boolean;
  isLoading: boolean;
  fromAdmin: boolean;
}

export const useNavigationGuard = () => {
  const [guardState, setGuardState] = useState<NavigationGuardState>({
    isNavigating: false,
    isLoading: false,
    fromAdmin: false
  });

  const queryClient = useQueryClient();
  const transitionTimer = useRef<NodeJS.Timeout | null>(null);

  const startNavigation = useCallback((fromPath: string, toPath: string) => {
    const isFromAdmin = fromPath.startsWith('/admin');
    const isToMarketplace = toPath === '/' || toPath === '/marketplace';

    logger.log(`🛡️ Navigation guard: ${fromPath} → ${toPath} (fromAdmin: ${isFromAdmin})`);

    setGuardState({
      isNavigating: true,
      isLoading: isFromAdmin && isToMarketplace,
      fromAdmin: isFromAdmin
    });

    // Cancel ongoing requests when leaving admin
    if (isFromAdmin) {
      requestDeduplicator.cancelRequests('marketplace');
      queryClient.cancelQueries();
    }

    // Set transition timeout for admin -> marketplace
    if (isFromAdmin && isToMarketplace) {
      transitionTimer.current = setTimeout(() => {
        logger.log('🛡️ Navigation guard: Transition complete');
        setGuardState(prev => ({
          ...prev,
          isNavigating: false,
          isLoading: false
        }));
      }, 800); // 800ms for smooth transition
    } else {
      // Normal navigation - immediate completion
      setTimeout(() => {
        setGuardState(prev => ({
          ...prev,
          isNavigating: false,
          isLoading: false
        }));
      }, 100);
    }
  }, [queryClient]);

  const clearGuard = useCallback(() => {
    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }
    
    setGuardState({
      isNavigating: false,
      isLoading: false,
      fromAdmin: false
    });
  }, []);

  const isTransitionSafe = useCallback((operation: string) => {
    if (guardState.isNavigating || guardState.isLoading) {
      logger.log(`⏳ Operation blocked during transition: ${operation}`);
      return false;
    }
    return true;
  }, [guardState]);

  return {
    guardState,
    startNavigation,
    clearGuard,
    isTransitionSafe
  };
};