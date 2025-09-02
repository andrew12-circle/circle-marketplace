import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

export const useSessionPersistence = () => {
  const { user, session } = useAuth();

  const triggerRecoveryBanner = useCallback((reason: string) => {
    sessionStorage.setItem('session_recovery_reason', reason);
    // Trigger a small state change to show the banner
    window.dispatchEvent(new CustomEvent('session-recovery', { detail: { reason } }));
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      logger.log('🔄 Attempting session restoration...');
      
      // First, try to get the current session
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.warn('Session check failed:', error);
        return false;
      }

      if (currentSession?.user) {
        logger.log('✅ Session already valid');
        return true;
      }

      // Try to refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        logger.warn('Session refresh failed:', refreshError);
        return false;
      }

      if (refreshedSession?.user) {
        logger.log('✅ Session restored via refresh');
        triggerRecoveryBanner('token_refresh');
        return true;
      }

      logger.log('❌ Session restoration failed');
      return false;
    } catch (error) {
      logger.error('Session restoration exception:', error);
      return false;
    }
  }, [triggerRecoveryBanner]);

  const handleSessionError = useCallback(async () => {
    logger.log('🚨 Session error detected, attempting recovery...');
    
    const restored = await restoreSession();
    
    if (!restored) {
      // Last resort: try to recover from localStorage
      try {
        const storedSession = localStorage.getItem('circle-auth-v1');
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          if (sessionData?.access_token) {
            logger.log('🔄 Attempting recovery from stored session...');
            const { error } = await supabase.auth.setSession({
              access_token: sessionData.access_token,
              refresh_token: sessionData.refresh_token
            });
            
            if (!error) {
              triggerRecoveryBanner('session_restore');
              return true;
            }
          }
        }
      } catch (e) {
        logger.warn('Failed to recover from stored session:', e);
      }
      
      triggerRecoveryBanner('auth_recovery');
    }
    
    return restored;
  }, [restoreSession, triggerRecoveryBanner]);

  // Monitor for session issues
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const handleAuthError = async (event: any) => {
      if (event?.error?.message?.includes('refresh_token_not_found') || 
          event?.error?.message?.includes('session_not_found')) {
        
        if (retryCount < maxRetries) {
          retryCount++;
          logger.log(`🔄 Auth error retry ${retryCount}/${maxRetries}`);
          
          setTimeout(async () => {
            await handleSessionError();
          }, 1000 * retryCount);
        }
      }
    };

    // Listen for auth state changes that might indicate errors
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' && user && !session) {
        // Unexpected sign out - attempt recovery
        logger.log('🚨 Unexpected sign out detected');
        await handleSessionError();
      }
      
      if (event === 'TOKEN_REFRESHED') {
        retryCount = 0; // Reset retry count on successful refresh
      }
    });

    // Global error handler for fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Check for auth-related errors
        if (response.status === 401 && args[0]?.toString().includes('supabase')) {
          logger.log('🚨 401 error detected from Supabase');
          setTimeout(handleSessionError, 100);
        }
        
        return response;
      } catch (error) {
        return originalFetch(...args);
      }
    };

    return () => {
      subscription.unsubscribe();
      window.fetch = originalFetch;
    };
  }, [user, handleSessionError]);

  return {
    restoreSession,
    handleSessionError,
    triggerRecoveryBanner
  };
};