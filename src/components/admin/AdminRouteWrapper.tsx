import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { ProvisionalProfileBanner } from '@/components/auth/ProvisionalProfileBanner';

interface AdminRouteWrapperProps {
  children: ReactNode;
}

// Check if user has unsaved changes in any editor
const hasUnsavedChanges = (): boolean => {
  try {
    const hasChangesElements = document.querySelectorAll('[data-has-changes="true"]');
    const isSavingElements = document.querySelectorAll('[data-is-saving="true"]');
    return hasChangesElements.length > 0 || isSavingElements.length > 0;
  } catch {
    return false;
  }
};

export const AdminRouteWrapper = ({ children }: AdminRouteWrapperProps) => {
  const { user } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useAdminStatus();

  // Stable session monitoring - auth state changes only, no polling
  useEffect(() => {
    if (!user || !isAdmin || adminLoading) return;
    
    logger.log('🔒 Admin route session monitoring activated (stable mode)');
    
    // Listen to auth state changes only
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Never auto-redirect if user has unsaved work
        if (hasUnsavedChanges()) {
          logger.warn('⚠️ Admin session expired but has unsaved changes - not redirecting');
          toast.error('Session expired. Please save your work and sign in again.', {
            duration: 10000,
            action: {
              label: 'Sign In',
              onClick: () => window.open('/auth', '_blank')
            }
          });
          return;
        }
        
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

  // Light visibility check - just logging
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && isAdmin) {
        logger.log('🔍 Admin returned to tab');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, isAdmin]);

  return (
    <>
      <ProvisionalProfileBanner />
      {children}
    </>
  );
};