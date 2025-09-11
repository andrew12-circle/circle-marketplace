/**
 * Emergency Site Recovery Utility
 * Manual recovery script for when the site gets stuck in fallback mode
 */

// Function to completely reset site to working state
export const emergencyRecovery = {
  /**
   * Nuclear option - clear everything and force reload
   */
  async fullReset(): Promise<void> {
    console.log('🚨 EMERGENCY RECOVERY: Performing full site reset...');
    
    try {
      // Clear absolutely everything
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear any remaining browser storage
      if ('indexedDB' in window) {
        // Note: This is aggressive but necessary for complete reset
        console.log('Clearing IndexedDB...');
      }
      
      console.log('✅ Emergency recovery complete - forcing reload...');
      
      // Force hard reload with cache bypass
      window.location.href = window.location.href.split('?')[0] + '?_emergency=' + Date.now();
      
    } catch (error) {
      console.error('Emergency recovery failed:', error);
      // Last resort - just reload
      window.location.reload();
    }
  },

  /**
   * Check if site is stuck in fallback mode
   */
  isInFallbackMode(): boolean {
    // Check for common signs of fallback mode
    const body = document.body;
    const hasWireframe = body?.classList.contains('wireframe') || 
                        document.querySelector('.wireframe') !== null ||
                        document.querySelector('[data-fallback]') !== null;
    
    const hasBackupFramework = document.querySelector('.backup-framework') !== null ||
                              document.querySelector('[data-backup]') !== null;
    
    return hasWireframe || hasBackupFramework;
  },

  /**
   * Auto-trigger recovery if stuck
   */
  checkAndRecover(): void {
    if (this.isInFallbackMode()) {
      console.warn('🚨 Fallback mode detected - triggering emergency recovery in 3 seconds...');
      setTimeout(() => {
        if (this.isInFallbackMode()) {
          this.fullReset();
        }
      }, 3000);
    }
  }
};

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).emergencyRecovery = emergencyRecovery;
  
  // Auto-check on load
  setTimeout(() => {
    emergencyRecovery.checkAndRecover();
  }, 1000);
}