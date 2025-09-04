import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

interface AdminRouteWrapperProps {
  children: ReactNode;
}

export const AdminRouteWrapper = ({ children }: AdminRouteWrapperProps) => {
  const { user } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useAdminStatus();

  // Light session monitoring for admin routes - no aggressive polling
  useEffect(() => {
    if (!user || !isAdmin || adminLoading) return;
    
    logger.log('🔒 Admin route session monitoring activated (light mode)');
    
    // Listen to auth state changes instead of polling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        logger.warn('⚠️ Admin user signed out, redirecting to auth');
        toast.error('Session expired. Please sign in again.', {
          duration: 5000,
          action: {
            label: 'Sign In',
            onClick: () => window.location.href = '/auth'
          }
        });
      } else if (event === 'TOKEN_REFRESHED') {
        logger.log('✅ Admin session token refreshed');
      }
    });

    return () => {
      subscription.unsubscribe();
      logger.log('🔓 Admin route session monitoring deactivated');
    };
  }, [user, isAdmin, adminLoading]);

  // Light visibility check - no aggressive session verification
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && isAdmin) {
        // Light check only - just log that admin returned to tab
        logger.log('🔍 Admin returned to tab');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, isAdmin]);

  return <>{children}</>;
};