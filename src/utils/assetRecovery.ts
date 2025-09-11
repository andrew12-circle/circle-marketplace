/**
 * Asset Recovery Utility
 * Detects and auto-recovers from CSS/JS asset loading failures
 */

import { cacheManager } from './cacheManager';

class AssetRecovery {
  private failureCount = 0;
  private readonly MAX_FAILURES = 5; // Increased from 2 to 5 to reduce false triggers
  private hasRecovered = false;
  private readonly isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('localhost');

  /**
   * Initialize asset failure detection
   */
  initialize(): void {
    // Temporarily disabled to stop fallback framework loop
    console.log('🛑 Asset recovery temporarily disabled to prevent fallback loop');
    return;
    
    if (typeof window === 'undefined') return;

    // Listen for CSS MIME type failures
    this.setupCSSFailureDetection();
    
    // Listen for JS loading failures
    this.setupJSFailureDetection();
    
    // Listen for general resource loading errors
    this.setupResourceErrorDetection();
  }

  /**
   * Setup CSS MIME type failure detection
   */
  private setupCSSFailureDetection(): void {
    // Override console.error to catch CSS MIME type errors
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('MIME type') && message.includes('text/html') && message.includes('stylesheet')) {
        this.handleAssetFailure('CSS MIME type error detected');
      }
      originalError.apply(console, args);
    };
  }

  /**
   * Setup JS loading failure detection
   */
  private setupJSFailureDetection(): void {
    window.addEventListener('error', (event) => {
      if (event.target && (event.target as any).tagName === 'SCRIPT') {
        this.handleAssetFailure('Script loading error detected');
      }
    });
  }

  /**
   * Setup general resource error detection
   */
  private setupResourceErrorDetection(): void {
    window.addEventListener('error', (event) => {
      if (event.target && 'src' in (event.target as any)) {
        const src = (event.target as any).src;
        if (src && (src.includes('.js') || src.includes('.css'))) {
          this.handleAssetFailure(`Resource loading error: ${src}`);
        }
      }
    }, true);
  }

  /**
   * Handle detected asset failures
   */
  private handleAssetFailure(reason: string): void {
    console.warn(`🚨 Asset failure detected: ${reason}`);
    
    this.failureCount++;
    
    // Auto-recover after multiple failures, but only once per session
    if (this.failureCount >= this.MAX_FAILURES && !this.hasRecovered) {
      this.hasRecovered = true;
      
      if (this.isDev) {
        console.log('🔄 Auto-triggering dev recovery due to asset failures...');
        this.triggerDevRecovery(reason);
      } else {
        console.log('🔄 Auto-triggering cache clear due to asset failures...');
        this.triggerCacheRecovery(reason);
      }
    }
  }

  /**
   * Trigger development recovery
   */
  private async triggerDevRecovery(reason: string): Promise<void> {
    try {
      // Show user notification if possible
      if (window.confirm?.(`Asset loading issues detected. Clear cache and reload?\n\nReason: ${reason}`)) {
        await cacheManager.forceDevRecovery();
      }
    } catch (error) {
      console.error('Dev recovery failed:', error);
    }
  }

  /**
   * Trigger cache recovery (production)
   */
  private async triggerCacheRecovery(reason: string): Promise<void> {
    try {
      await cacheManager.clearAllCachePreserveSession();
      cacheManager.forceReload('asset_recovery');
    } catch (error) {
      console.error('Cache recovery failed:', error);
    }
  }

  /**
   * Reset failure count (useful for testing)
   */
  reset(): void {
    this.failureCount = 0;
    this.hasRecovered = false;
  }
}

export const assetRecovery = new AssetRecovery();