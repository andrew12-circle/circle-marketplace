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
  const { user, session } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useAdminStatus();

  // Session stickiness for admin routes
  useEffect(() => {
    let sessionCheckInterval: NodeJS.Timeout;
    
    if (user && isAdmin && !adminLoading) {
      logger.log('🔒 Admin route session monitoring activated');
      
      // Check session health every 30 seconds for admin users
      sessionCheckInterval = setInterval(async () => {
        if (!session?.access_token) {
          logger.warn('⚠️ Admin session token missing, attempting refresh...');
          
          try {
            // Try to refresh the session silently
            const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
            
            if (error || !newSession) {
              logger.error('❌ Admin session refresh failed:', error);
              toast.error('Session expired. Please sign in again.', {
                duration: 5000,
                action: {
                  label: 'Sign In',
                  onClick: () => window.location.href = '/auth'
                }
              });
            } else {
              logger.log('✅ Admin session refreshed successfully');
            }
          } catch (refreshError) {
            logger.error('❌ Session refresh exception:', refreshError);
          }
        }
      }, 30000); // Check every 30 seconds
    }

    return () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        logger.log('🔓 Admin route session monitoring deactivated');
      }
    };
  }, [user, session, isAdmin, adminLoading]);

  // Admin-specific error recovery
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && isAdmin) {
        // When admin returns to tab, verify session is still valid
        setTimeout(async () => {
          try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (!currentSession?.access_token) {
              logger.warn('⚠️ Admin returned to expired session, attempting recovery...');
              await supabase.auth.refreshSession();
            }
          } catch (error) {
            logger.error('❌ Admin session recovery failed:', error);
          }
        }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, isAdmin]);

  return <>{children}</>;
};