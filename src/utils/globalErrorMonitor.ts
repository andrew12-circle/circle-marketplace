import { supabase } from '@/integrations/supabase/client';
import { reportClientError } from '@/utils/errorReporting';
import { cacheManager } from '@/utils/cacheManager';

// Version enforcement tracking
let versionEnforcedAt: number | null = null;
const VERSION_ENFORCE_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

interface AppConfig {
  auto_heal_enabled: boolean;
  maintenance_mode: boolean;
  maintenance_message?: string;
}

interface GlobalMonitoringConfig {
  errorThreshold: number;
  timeWindow: number; // minutes
  autoHealingEnabled: boolean;
  bootCanaryEnabled: boolean;
}

class GlobalErrorMonitor {
  private errorCount = 0;
  private errorTimeWindow: number[] = [];
  private config: GlobalMonitoringConfig = {
    errorThreshold: 15, // Increased threshold
    timeWindow: 10, // Increased time window
    autoHealingEnabled: false, // Disabled by default - read from server
    bootCanaryEnabled: false // Disabled until we're more stable
  };
  private serverConfig: AppConfig | null = null;
  private isInitialized = false;
  private bootCanaryPassed = false;

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🔍 Initializing global error monitoring...');
    
    // Load server configuration first
    await this.loadServerConfig();
    
    // Boot canary check (only if enabled in server config)
    if (this.config.bootCanaryEnabled && this.serverConfig?.auto_heal_enabled) {
      await this.performBootCanary();
    }

    // Set up global error handlers
    this.setupGlobalErrorHandlers();
    
    // Check app configuration
    await this.checkAppConfiguration();
    
    this.isInitialized = true;
    console.log('✅ Global error monitoring initialized');
  }

  private async loadServerConfig() {
    try {
      const { data } = await supabase
        .from('app_config')
        .select('auto_heal_enabled, maintenance_mode, maintenance_message')
        .limit(1)
        .maybeSingle();
      
      this.serverConfig = data || { auto_heal_enabled: false, maintenance_mode: false };
      this.config.autoHealingEnabled = this.serverConfig.auto_heal_enabled;
      
      console.log('📋 Server config loaded:', { autoHeal: this.serverConfig.auto_heal_enabled });
    } catch (error) {
      console.warn('Failed to load server config:', error);
      this.serverConfig = { auto_heal_enabled: false, maintenance_mode: false };
    }
  }

  private async performBootCanary() {
    try {
      console.log('🐤 Performing boot canary check...');
      
      // Test basic app functionality
      const tests = [
        this.testSupabaseConnection(),
        this.testLocalStorage(),
        this.testBasicRender()
      ];

      const results = await Promise.allSettled(tests);
      const failures = results.filter(result => result.status === 'rejected');

      if (failures.length > 0) {
        console.warn('⚠️ Boot canary detected issues:', failures);
        this.showSafeReloadBanner();
      } else {
        this.bootCanaryPassed = true;
        console.log('✅ Boot canary passed');
      }
    } catch (error) {
      console.error('❌ Boot canary failed:', error);
      this.showSafeReloadBanner();
    }
  }

  private showSafeReloadBanner() {
    const bannerId = 'safe-reload-banner';
    if (document.getElementById(bannerId)) return; // Already shown

    const banner = document.createElement('div');
    banner.id = bannerId;
    banner.innerHTML = `
      <div style="
        position: fixed; 
        top: 0; 
        left: 0; 
        right: 0; 
        background: hsl(var(--destructive)); 
        color: hsl(var(--destructive-foreground)); 
        padding: 12px; 
        text-align: center; 
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      ">
        ⚠️ Connection issues detected. 
        <button onclick="window.location.reload()" style="
          margin-left: 8px; 
          padding: 4px 12px; 
          background: rgba(255,255,255,0.2); 
          color: inherit; 
          border: 1px solid rgba(255,255,255,0.3); 
          border-radius: 4px; 
          cursor: pointer;
        ">
          Safe Reload
        </button>
        <button onclick="document.getElementById('${bannerId}').remove()" style="
          margin-left: 8px; 
          padding: 4px 8px; 
          background: transparent; 
          color: inherit; 
          border: none; 
          cursor: pointer;
        ">
          ✕
        </button>
      </div>
    `;
    
    document.body.appendChild(banner);
  }

  private showSoftErrorNotification() {
    const bannerId = 'soft-error-notification';
    if (document.getElementById(bannerId)) return; // Already shown

    const banner = document.createElement('div');
    banner.id = bannerId;
    banner.innerHTML = `
      <div style="
        position: fixed; 
        top: 0; 
        left: 0; 
        right: 0; 
        background: hsl(var(--warning)); 
        color: hsl(var(--warning-foreground)); 
        padding: 8px; 
        text-align: center; 
        z-index: 9998;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">
        ⚠️ Experiencing some connectivity issues
        <button onclick="document.getElementById('${bannerId}').remove()" style="
          margin-left: 8px; 
          padding: 2px 6px; 
          background: transparent; 
          color: inherit; 
          border: none; 
          cursor: pointer;
        ">
          ✕
        </button>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      const el = document.getElementById(bannerId);
      if (el) el.remove();
    }, 5000);
  }

  private async testSupabaseConnection(): Promise<void> {
    const { data, error } = await supabase
      .from('app_config')
      .select('id')
      .limit(1);
    
    if (error) throw new Error(`Supabase connection failed: ${error.message}`);
  }

  private testLocalStorage(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const testKey = 'canary_test';
        localStorage.setItem(testKey, 'test');
        const value = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (value !== 'test') {
          reject(new Error('LocalStorage test failed'));
        }
        resolve();
      } catch (error) {
        reject(new Error(`LocalStorage error: ${error}`));
      }
    });
  }

  private testBasicRender(): Promise<void> {
    return new Promise((resolve) => {
      // Simple render test - check if DOM is responsive
      const testDiv = document.createElement('div');
      testDiv.textContent = 'canary';
      document.body.appendChild(testDiv);
      
      requestAnimationFrame(() => {
        document.body.removeChild(testDiv);
        resolve();
      });
    });
  }

  private setupGlobalErrorHandlers() {
    // JavaScript runtime errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'runtime_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'unhandled_promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack
      });
    });

    // Network errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && response.status >= 500) {
          this.handleError({
            type: 'network_error',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: args[0]?.toString()
          });
        }
        return response;
      } catch (error) {
        this.handleError({
          type: 'network_error',
          message: error.message,
          url: args[0]?.toString()
        });
        throw error;
      }
    };
  }

  private async handleError(errorInfo: any) {
    this.errorCount++;
    this.errorTimeWindow.push(Date.now());
    
    // Clean old errors outside time window
    const cutoff = Date.now() - (this.config.timeWindow * 60 * 1000);
    this.errorTimeWindow = this.errorTimeWindow.filter(time => time > cutoff);

    // Report to backend
    await reportClientError({
      error_type: errorInfo.type,
      message: errorInfo.message,
      stack: errorInfo.stack,
      url: errorInfo.url || window.location.href,
      section: 'global_monitor'
    });

    // Check if we've hit the error threshold - much more conservative
    if (this.errorTimeWindow.length >= this.config.errorThreshold) {
      console.warn(`🚨 Error threshold reached: ${this.errorTimeWindow.length} errors in ${this.config.timeWindow} minutes`);
      
      // Only show soft warning, don't immediately trigger reload
      this.showSoftErrorNotification();
      
      // Only escalate to self-healing for extremely high error counts AND if enabled on server
      const criticalThreshold = this.config.errorThreshold * 2; // Much higher bar
      if (this.config.autoHealingEnabled && 
          this.serverConfig?.auto_heal_enabled && 
          this.errorTimeWindow.length >= criticalThreshold) {
        console.warn(`🚨 CRITICAL: ${this.errorTimeWindow.length} errors, triggering self-heal`);
        await this.triggerSelfHealing('critical_error_threshold');
      }
    }
  }

  private async triggerSelfHealing(reason: string) {
    // Throttle self-healing to prevent loops
    if (!cacheManager.canSelfHeal()) {
      console.log(`🔧 Self-healing throttled for: ${reason}`);
      return;
    }

    console.log(`🔧 Triggering self-healing for: ${reason}`);
    cacheManager.markSelfHealExecuted();
    
    try {
      // Step 1: Clear caches while preserving session
      await cacheManager.clearAllCachePreserveSession();
      console.log('✅ Caches cleared (session preserved)');

      // Step 2: Reset error counters
      this.errorCount = 0;
      this.errorTimeWindow = [];
      console.log('✅ Error counters reset');

      // Step 3: Check for remote configuration
      const { data: config } = await supabase
        .from('app_config')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .maybeSingle();

      if (config?.force_cache_bust_after) {
        const bustTime = new Date(config.force_cache_bust_after);
        const lastBust = localStorage.getItem('last_cache_bust');
        
        if (!lastBust || new Date(lastBust) < bustTime) {
          console.log('💥 Remote cache bust triggered');
          localStorage.setItem('last_cache_bust', new Date().toISOString());
          cacheManager.forceReload('self_heal');
          return;
        }
      }

      // Step 4: Gradual escalation based on severity
      if (reason === 'error_threshold_exceeded') {
        // Wait a bit, then soft reload
        setTimeout(() => {
          console.log('🔄 Performing soft reload...');
          cacheManager.forceReload('self_heal');
        }, 2000);
      }

    } catch (error) {
      console.error('❌ Self-healing failed:', error);
      
      // Last resort: hard reload
      setTimeout(() => {
        console.log('🔄 Performing emergency reload...');
        window.location.href = window.location.href;
      }, 5000);
    }
  }

  private async checkAppConfiguration() {
    try {
      const { data: config } = await supabase
        .from('app_config')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .maybeSingle();

      if (config?.maintenance_mode) {
        this.showMaintenanceMessage(config.maintenance_message);
        return;
      }

      // Check if app version is outdated with throttling
      if (config?.min_build_version) {
        const currentVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
        const now = Date.now();
        
        // Only enforce version once per cooldown period
        if (this.isVersionOutdated(currentVersion, config.min_build_version)) {
          if (!versionEnforcedAt || (now - versionEnforcedAt) > VERSION_ENFORCE_COOLDOWN) {
            console.log('📱 App version outdated, triggering refresh...');
            versionEnforcedAt = now;
            await cacheManager.clearAllCachePreserveSession();
            cacheManager.forceReload('version_update');
          } else {
            console.log('📱 Version update needed but throttled');
            this.showVersionUpdateBanner(config.min_build_version);
          }
        }
      }

    } catch (error) {
      console.error('Failed to check app configuration:', error);
    }
  }

  private isVersionOutdated(current: string, required: string): boolean {
    const currentParts = current.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const requiredPart = requiredParts[i] || 0;
      
      if (currentPart < requiredPart) return true;
      if (currentPart > requiredPart) return false;
    }
    
    return false;
  }

  private showMaintenanceMessage(message?: string) {
    const maintenanceHtml = `
      <div style="
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 100%; 
        height: 100%; 
        background: rgba(0,0,0,0.8); 
        color: white; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="text-align: center; padding: 2rem;">
          <h1>🚧 Maintenance Mode</h1>
          <p>${message || 'The application is currently under maintenance. Please check back soon.'}</p>
          <button onclick="window.location.reload()" style="
            margin-top: 1rem; 
            padding: 0.5rem 1rem; 
            background: #0066cc; 
            color: white; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer;
          ">
            Retry
          </button>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', maintenanceHtml);
  }

  private showVersionUpdateBanner(requiredVersion: string) {
    const bannerId = 'version-update-banner';
    if (document.getElementById(bannerId)) return; // Already shown

    const banner = document.createElement('div');
    banner.id = bannerId;
    banner.innerHTML = `
      <div style="
        position: fixed; 
        top: 0; 
        left: 0; 
        right: 0; 
        background: hsl(var(--primary)); 
        color: hsl(var(--primary-foreground)); 
        padding: 8px; 
        text-align: center; 
        z-index: 9997;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
      ">
        🚀 App update available (v${requiredVersion}). 
        <button onclick="window.location.reload()" style="
          margin-left: 8px; 
          padding: 4px 12px; 
          background: rgba(255,255,255,0.2); 
          color: inherit; 
          border: 1px solid rgba(255,255,255,0.3); 
          border-radius: 4px; 
          cursor: pointer;
        ">
          Update Now
        </button>
        <button onclick="document.getElementById('${bannerId}').remove()" style="
          margin-left: 8px; 
          padding: 4px 8px; 
          background: transparent; 
          color: inherit; 
          border: none; 
          cursor: pointer;
        ">
          Later
        </button>
      </div>
    `;
    
    document.body.appendChild(banner);
  }

  getHealthStatus() {
    return {
      errorCount: this.errorCount,
      recentErrors: this.errorTimeWindow.length,
      bootCanaryPassed: this.bootCanaryPassed,
      isHealthy: this.errorTimeWindow.length < this.config.errorThreshold
    };
  }
}

export const globalErrorMonitor = new GlobalErrorMonitor();