import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthError {
  message: string;
  status?: number;
}

interface AuthErrorHandlerOptions {
  onSignOut?: () => void;
  onSessionRecovery?: () => void;
  showToast?: boolean;
}

export class AuthErrorHandler {
  private static isRecoveringSession = false;
  private static recoveryAttempts = 0;
  private static maxRecoveryAttempts = 3;

  /**
   * Handle authentication errors, especially session expiration
   */
  static async handleAuthError(
    error: AuthError | any, 
    context: string = 'Unknown',
    options: AuthErrorHandlerOptions = {}
  ): Promise<boolean> {
    const { onSignOut, onSessionRecovery, showToast = true } = options;
    
    logger.error(`Auth error in ${context}:`, error);

    // Check if this is a session expiration error
    const isSessionExpired = this.isSessionExpiredError(error);
    const isInvalidRefreshToken = this.isInvalidRefreshTokenError(error);

    if (isSessionExpired || isInvalidRefreshToken) {
      return this.handleSessionExpiration(context, { onSignOut, onSessionRecovery, showToast });
    }

    // Handle other auth errors
    if (error?.status === 401 || error?.message?.includes('Unauthorized')) {
      return this.handleUnauthorizedError(context, { onSignOut, showToast });
    }

    // For non-auth errors, just log and return false
    return false;
  }

  /**
   * Check if error indicates session expiration
   */
  private static isSessionExpiredError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    return (
      message.includes('session expired') ||
      message.includes('session not found') ||
      message.includes('jwt expired') ||
      error.code === 'session_expired'
    );
  }

  /**
   * Check if error indicates invalid refresh token
   */
  private static isInvalidRefreshTokenError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    return (
      message.includes('invalid refresh token') ||
      message.includes('refresh token expired') ||
      message.includes('refresh token not found')
    );
  }

  /**
   * Handle session expiration with recovery attempts
   */
  private static async handleSessionExpiration(
    context: string,
    options: AuthErrorHandlerOptions
  ): Promise<boolean> {
    const { onSignOut, onSessionRecovery, showToast } = options;

    // Prevent multiple concurrent recovery attempts
    if (this.isRecoveringSession) {
      logger.log('Session recovery already in progress, skipping...');
      return true;
    }

    // Check recovery attempt limits
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      logger.warn('Max session recovery attempts reached, forcing sign out');
      await this.forceSignOut(onSignOut, showToast);
      return true;
    }

    this.isRecoveringSession = true;
    this.recoveryAttempts++;

    try {
      logger.log(`Attempting session recovery (attempt ${this.recoveryAttempts}/${this.maxRecoveryAttempts})`);

      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        logger.error('Session recovery failed:', error);
        
        // If this was our last attempt, force sign out
        if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
          await this.forceSignOut(onSignOut, showToast);
          return true;
        }

        // Otherwise, try again after a delay
        setTimeout(() => {
          this.isRecoveringSession = false;
        }, 1000);

        return false;
      }

      // Recovery successful
      logger.log('Session recovery successful');
      this.recoveryAttempts = 0;
      this.isRecoveringSession = false;

      if (showToast) {
        toast.success('Session restored successfully');
      }

      // Notify about successful recovery
      onSessionRecovery?.();
      
      return true;

    } catch (recoveryError) {
      logger.error('Session recovery exception:', recoveryError);
      this.isRecoveringSession = false;

      // If this was our last attempt, force sign out
      if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
        await this.forceSignOut(onSignOut, showToast);
        return true;
      }

      return false;
    }
  }

  /**
   * Handle unauthorized errors
   */
  private static async handleUnauthorizedError(
    context: string,
    options: Pick<AuthErrorHandlerOptions, 'onSignOut' | 'showToast'>
  ): Promise<boolean> {
    const { onSignOut, showToast } = options;

    logger.warn(`Unauthorized access in ${context}, signing out user`);
    
    if (showToast) {
      toast.error('Session expired. Please sign in again.');
    }

    await this.forceSignOut(onSignOut, showToast);
    return true;
  }

  /**
   * Force sign out and clean up
   */
  private static async forceSignOut(
    onSignOut?: () => void,
    showToast: boolean = true
  ): Promise<void> {
    try {
      // Clear local state first
      this.resetRecoveryState();

      // Clear any cached auth data
      localStorage.removeItem('sb-session');
      localStorage.removeItem('supabase.auth.token');

      // Sign out from Supabase
      await supabase.auth.signOut();

      if (showToast) {
        toast.info('You have been signed out due to session expiration');
      }

      // Custom sign out callback
      onSignOut?.();

      // Redirect to auth page if we're not already there
      if (!window.location.pathname.includes('/auth')) {
        // Add a small delay to ensure state cleanup
        setTimeout(() => {
          window.location.href = '/auth?reason=session_expired';
        }, 100);
      }

    } catch (error) {
      logger.error('Error during force sign out:', error);
      // Even if sign out fails, still redirect to auth
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth?reason=error';
      }
    }
  }

  /**
   * Reset recovery state
   */
  private static resetRecoveryState(): void {
    this.isRecoveringSession = false;
    this.recoveryAttempts = 0;
  }

  /**
   * Manually trigger session recovery (for testing/debugging)
   */
  static async manualSessionRecovery(): Promise<boolean> {
    this.resetRecoveryState();
    return this.handleSessionExpiration('manual_recovery', {
      showToast: true
    });
  }

  /**
   * Check if currently recovering session
   */
  static get isRecovering(): boolean {
    return this.isRecoveringSession;
  }

  /**
   * Get current recovery attempt count
   */
  static get attemptCount(): number {
    return this.recoveryAttempts;
  }
}

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    
    // Check if this is an auth-related error
    if (error && typeof error === 'object') {
      const isAuthError = AuthErrorHandler['isSessionExpiredError'](error) || 
                         AuthErrorHandler['isInvalidRefreshTokenError'](error);
      
      if (isAuthError) {
        logger.warn('Unhandled auth error detected, attempting recovery:', error);
        AuthErrorHandler.handleAuthError(error, 'unhandled_rejection', {
          showToast: false // Don't show toast for unhandled errors
        });
        event.preventDefault(); // Prevent the error from appearing in console
      }
    }
  });

  // Expose for debugging
  (window as any).authErrorHandler = AuthErrorHandler;
}
