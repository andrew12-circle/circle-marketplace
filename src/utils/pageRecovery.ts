/**
 * Page Recovery Utilities
 * Helps recover from stuck states and timeouts
 */

import { logger } from './logger';

interface RecoveryOptions {
  clearCache?: boolean;
  reloadAuth?: boolean;
  revalidateQueries?: boolean;
  resetLocalStorage?: boolean;
}

class PageRecovery {
  private static instance: PageRecovery;
  private recoveryInProgress = false;
  private lastRecoveryTime = 0;
  private recoveryCount = 0;

  static getInstance(): PageRecovery {
    if (!PageRecovery.instance) {
      PageRecovery.instance = new PageRecovery();
    }
    return PageRecovery.instance;
  }

  async recover(options: RecoveryOptions = {}) {
    const now = Date.now();
    
    // Prevent too frequent recovery attempts
    if (now - this.lastRecoveryTime < 5000) {
      logger.log('Recovery attempt too recent, skipping');
      return;
    }

    if (this.recoveryInProgress) {
      logger.log('Recovery already in progress, skipping');
      return;
    }

    this.recoveryInProgress = true;
    this.lastRecoveryTime = now;
    this.recoveryCount++;

    logger.log('🔄 Starting page recovery', { 
      attempt: this.recoveryCount, 
      options 
    });

    try {
      // Clear React Query cache if available
      if (options.revalidateQueries && (window as any).queryClient) {
        logger.log('Clearing React Query cache...');
        (window as any).queryClient.invalidateQueries();
      }

      // Clear auth-related localStorage
      if (options.resetLocalStorage) {
        logger.log('Clearing auth localStorage...');
        const keysToRemove = [
          'sb-session',
          'supabase.auth.token',
          'circle-auth-v1'
        ];
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            // Ignore localStorage errors
          }
        });
      }

      // Trigger auth recovery if available
      if (options.reloadAuth && (window as any).authRecovery) {
        logger.log('Triggering auth recovery...');
        (window as any).authRecovery();
      }

      // Force page refresh as last resort
      if (options.clearCache) {
        logger.log('Performing hard refresh...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }

      logger.log('✅ Recovery completed successfully');
      
    } catch (error) {
      logger.error('❌ Recovery failed:', error);
    } finally {
      this.recoveryInProgress = false;
    }
  }

  // Auto-recovery for common stuck states
  enableAutoRecovery() {
    let timeoutCount = 0;
    let lastTimeoutTime = 0;

    // Monitor for timeout errors - but be much more conservative
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      
      if (message.includes('timeout') || message.includes('Request timed out')) {
        const now = Date.now();
        
        // Count recent timeouts - increased time window to 30 seconds
        if (now - lastTimeoutTime < 30000) {
          timeoutCount++;
        } else {
          timeoutCount = 1;
        }
        
        lastTimeoutTime = now;
        
        // Only auto-recover after many more timeouts and avoid reloads
        if (timeoutCount >= 8) {
          logger.log('Many timeouts detected, soft recovery only');
          this.recover({
            revalidateQueries: true,
            reloadAuth: true
            // Removed clearCache to prevent reloads
          });
          timeoutCount = 0;
        }
      }
      
      originalConsoleError.apply(console, args);
    };

    logger.log('Auto-recovery enabled (conservative mode)');
  }

  // Expose recovery functions globally for debugging
  exposeGlobalRecovery() {
    if (typeof window !== 'undefined') {
      (window as any).pageRecovery = {
        recover: (options?: RecoveryOptions) => this.recover(options),
        fullRecovery: () => this.recover({
          clearCache: true,
          reloadAuth: true,
          revalidateQueries: true,
          resetLocalStorage: true
        }),
        authRecovery: () => this.recover({
          reloadAuth: true,
          revalidateQueries: true
        }),
        cacheRecovery: () => this.recover({
          revalidateQueries: true
        })
      };
      
      logger.log('🛠️ Page recovery tools available at window.pageRecovery');
    }
  }
}

export const pageRecovery = PageRecovery.getInstance();

// Auto-initialize
if (typeof window !== 'undefined') {
  pageRecovery.enableAutoRecovery();
  pageRecovery.exposeGlobalRecovery();
}