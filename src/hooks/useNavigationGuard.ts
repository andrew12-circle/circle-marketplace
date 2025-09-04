import { useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface NavigationGuardOptions {
  hasUnsavedChanges: boolean;
  message?: string;
}

export const useNavigationGuard = ({
  hasUnsavedChanges,
  message = "You have unsaved changes. Are you sure you want to leave?"
}: NavigationGuardOptions) => {

  // Prevent page unload when there are unsaved changes
  const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = message;
      logger.log('🚨 Navigation blocked due to unsaved changes');
      return message;
    }
  }, [hasUnsavedChanges, message]);

  useEffect(() => {
    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      logger.log('🛡️ Navigation guard activated');
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        logger.log('🛡️ Navigation guard deactivated');
      };
    }
  }, [hasUnsavedChanges, handleBeforeUnload]);
};