// Advanced JavaScript optimization for reducing unused bundles
import { taskScheduler } from './taskScheduler';

interface DeferredModule {
  name: string;
  loader: () => Promise<any>;
  condition?: () => boolean;
  priority: 'critical' | 'high' | 'normal' | 'low';
}

class JavaScriptOptimizer {
  private loadedModules = new Set<string>();
  private loadingPromises = new Map<string, Promise<any>>();
  
  // Define modules that can be loaded on demand
  private deferredModules: DeferredModule[] = [
    {
      name: 'charts',
      loader: () => import('recharts'),
      condition: () => this.isChartsNeeded(),
      priority: 'low'
    },
    {
      name: 'radix-non-critical',
      loader: () => this.loadNonCriticalRadix(),
      condition: () => this.isRadixExtensionsNeeded(),
      priority: 'normal'
    },
    {
      name: 'supabase-analytics',
      loader: () => this.loadSupabaseAnalytics(),
      condition: () => this.isAnalyticsNeeded(),
      priority: 'low'
    },
    {
      name: 'vendor-utilities',
      loader: () => this.loadVendorUtilities(),
      condition: () => this.isVendorUtilitiesNeeded(),
      priority: 'normal'
    }
  ];

  // Check if charts are needed (dashboard/analytics routes)
  private isChartsNeeded(): boolean {
    const route = window.location.pathname;
    return route.includes('/dashboard') || 
           route.includes('/analytics') || 
           route.includes('/vendor-dashboard') ||
           route.includes('/command-center');
  }

  // Check if non-critical Radix components are needed
  private isRadixExtensionsNeeded(): boolean {
    const route = window.location.pathname;
    return route.includes('/admin') || 
           route.includes('/settings') ||
           route.includes('/profile');
  }

  // Check if analytics features are needed
  private isAnalyticsNeeded(): boolean {
    const route = window.location.pathname;
    return route.includes('/analytics') || 
           route.includes('/dashboard') ||
           route.includes('/admin');
  }

  // Check if vendor utilities are needed
  private isVendorUtilitiesNeeded(): boolean {
    const route = window.location.pathname;
    return route.includes('/vendor') || 
           route.includes('/creator') ||
           route.includes('/admin');
  }

  // Load non-critical Radix components
  private async loadNonCriticalRadix() {
    return Promise.all([
      import('@radix-ui/react-accordion'),
      import('@radix-ui/react-collapsible'),
      import('@radix-ui/react-context-menu'),
      import('@radix-ui/react-hover-card'),
      import('@radix-ui/react-menubar'),
      import('@radix-ui/react-navigation-menu')
    ]);
  }

  // Load Supabase analytics features
  private async loadSupabaseAnalytics() {
    return import('@/integrations/supabase/client').then(module => ({
      client: module.supabase,
      tracking: 'deferred'
    }));
  }

  // Load vendor utilities
  private async loadVendorUtilities() {
    return Promise.all([
      import('@/utils/cacheManager'),
      import('@/utils/globalErrorMonitor'),
      import('@/utils/performanceOptimizer')
    ]);
  }

  // Load module on demand
  async loadModule(name: string): Promise<any> {
    if (this.loadedModules.has(name)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }

    const moduleConfig = this.deferredModules.find(m => m.name === name);
    if (!moduleConfig) {
      throw new Error(`Unknown module: ${name}`);
    }

    const loadPromise = this.scheduleLoad(moduleConfig);
    this.loadingPromises.set(name, loadPromise);

    return loadPromise;
  }

  // Schedule loading based on priority
  private async scheduleLoad(config: DeferredModule): Promise<any> {
    return new Promise((resolve, reject) => {
      const load = async () => {
        try {
          const module = await config.loader();
          this.loadedModules.add(config.name);
          resolve(module);
        } catch (error) {
          reject(error);
        }
      };

      switch (config.priority) {
        case 'critical':
          load();
          break;
        case 'high':
          taskScheduler.schedule(load);
          break;
        case 'normal':
          if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(load, { timeout: 1000 });
          } else {
            setTimeout(load, 100);
          }
          break;
        case 'low':
          if ('requestIdleCallback' in window) {
            (window as any).requestIdleCallback(load, { timeout: 5000 });
          } else {
            setTimeout(load, 500);
          }
          break;
      }
    });
  }

  // Initialize conditional loading based on current route
  initializeConditionalLoading() {
    this.deferredModules.forEach(config => {
      if (config.condition && config.condition()) {
        this.loadModule(config.name).catch(error => {
          console.warn(`Failed to load module ${config.name}:`, error);
        });
      }
    });
  }

  // Debounced preload to avoid excessive calls
  private preloadDebounceTimer: number | null = null;

  // Preload modules for route transitions
  preloadForRoute(route: string | URL) {
    // Normalize route input
    let normalizedRoute: string;
    try {
      if (typeof route === 'string') {
        normalizedRoute = route.startsWith('/') ? route : `/${route}`;
      } else if (route && typeof route === 'object' && 'pathname' in route) {
        normalizedRoute = route.pathname;
      } else {
        normalizedRoute = window.location.pathname;
      }
    } catch (error) {
      console.warn('Invalid route provided to preloadForRoute:', route);
      return;
    }

    // Early return if same as current route
    if (normalizedRoute === window.location.pathname) {
      return;
    }

    // Debounce preloads to avoid bursts
    if (this.preloadDebounceTimer) {
      clearTimeout(this.preloadDebounceTimer);
    }

    this.preloadDebounceTimer = window.setTimeout(() => {
      try {
        this.deferredModules.forEach(config => {
          if (config.condition && this.evaluateConditionForRoute(normalizedRoute) && !this.loadedModules.has(config.name)) {
            this.loadModule(config.name).catch(error => {
              console.warn(`Failed to preload module ${config.name}:`, error);
            });
          }
        });
      } catch (error) {
        console.warn('Error during route preloading:', error);
      }
    }, 100);
  }

  // Helper method to safely check conditions for a specific route
  private checkConditionForRoute(condition: () => boolean, route: string): boolean {
    try {
      // Create a scoped evaluation that simulates the route condition
      return this.evaluateConditionForRoute(route);
    } catch (error) {
      console.warn('Error evaluating condition for route:', route, error);
      return false;
    }
  }

  // Evaluate what modules would be needed for a specific route
  private evaluateConditionForRoute(route: string): boolean {
    // Directly check route patterns instead of modifying location
    const isChartsRoute = route.includes('/dashboard') || 
                         route.includes('/analytics') || 
                         route.includes('/vendor-dashboard') ||
                         route.includes('/command-center');
    
    const isRadixRoute = route.includes('/admin') || 
                        route.includes('/settings') ||
                        route.includes('/profile');
    
    const isAnalyticsRoute = route.includes('/analytics') || 
                            route.includes('/dashboard') ||
                            route.includes('/admin');
    
    const isVendorRoute = route.includes('/vendor') || 
                         route.includes('/creator') ||
                         route.includes('/admin');
    
    // Return true if any of these conditions would require module loading
    return isChartsRoute || isRadixRoute || isAnalyticsRoute || isVendorRoute;
  }
}

export const jsOptimizer = new JavaScriptOptimizer();

// Initialize optimization
export const initJavaScriptOptimization = () => {
  if (typeof window === 'undefined') return;

  // Set up conditional loading
  jsOptimizer.initializeConditionalLoading();

  // Set up route-based preloading with robust error handling
  try {
    const nav = (window as any).navigation;
    if (nav && typeof nav.addEventListener === 'function') {
      nav.addEventListener('navigate', (event: any) => {
        try {
          if (event?.destination?.url) {
            const url = new URL(event.destination.url);
            jsOptimizer.preloadForRoute(url.pathname);
          }
        } catch (error) {
          console.debug('Navigation API preload error:', error);
        }
      });
    }
  } catch (error) {
    console.debug('Navigation API not supported or failed to setup:', error);
  }

  // Fallback for browsers without Navigation API + additional event handlers
  try {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      const result = originalPushState.apply(this, args);
      if (args[2] && typeof args[2] === 'string') {
        jsOptimizer.preloadForRoute(args[2]);
      }
      return result;
    };

    history.replaceState = function(...args) {
      const result = originalReplaceState.apply(this, args);
      if (args[2] && typeof args[2] === 'string') {
        jsOptimizer.preloadForRoute(args[2]);
      }
      return result;
    };

    // Handle back/forward navigation
    window.addEventListener('popstate', () => {
      jsOptimizer.preloadForRoute(window.location.pathname);
    });
  } catch (error) {
    console.debug('History API patching failed:', error);
  }
};