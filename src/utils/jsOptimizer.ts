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

  // Preload modules for route transitions
  preloadForRoute(route: string) {
    // Create a temporary check function with the target route
    const shouldLoadForRoute = (targetRoute: string) => {
      return this.deferredModules.some(config => {
        if (!config.condition) return false;
        
        // Check conditions based on the target route instead of modifying window.location
        const routeChecks = {
          charts: targetRoute.includes('/dashboard') || 
                 targetRoute.includes('/analytics') || 
                 targetRoute.includes('/vendor-dashboard') ||
                 targetRoute.includes('/command-center'),
          'radix-non-critical': targetRoute.includes('/admin') || 
                               targetRoute.includes('/settings') ||
                               targetRoute.includes('/profile'),
          'supabase-analytics': targetRoute.includes('/analytics') || 
                               targetRoute.includes('/dashboard') ||
                               targetRoute.includes('/admin'),
          'vendor-utilities': targetRoute.includes('/vendor') || 
                             targetRoute.includes('/creator') ||
                             targetRoute.includes('/admin')
        };
        
        return routeChecks[config.name as keyof typeof routeChecks] || false;
      });
    };

    // Preload modules needed for the target route
    this.deferredModules.forEach(config => {
      const routeNeedsModule = this.checkRouteNeedsModule(config.name, route);
      if (routeNeedsModule && !this.loadedModules.has(config.name)) {
        this.loadModule(config.name).catch(error => {
          console.warn(`Failed to preload module ${config.name}:`, error);
        });
      }
    });
  }

  // Helper method to check if a route needs a specific module
  private checkRouteNeedsModule(moduleName: string, route: string): boolean {
    switch (moduleName) {
      case 'charts':
        return route.includes('/dashboard') || 
               route.includes('/analytics') || 
               route.includes('/vendor-dashboard') ||
               route.includes('/command-center');
      case 'radix-non-critical':
        return route.includes('/admin') || 
               route.includes('/settings') ||
               route.includes('/profile');
      case 'supabase-analytics':
        return route.includes('/analytics') || 
               route.includes('/dashboard') ||
               route.includes('/admin');
      case 'vendor-utilities':
        return route.includes('/vendor') || 
               route.includes('/creator') ||
               route.includes('/admin');
      default:
        return false;
    }
  }
}

export const jsOptimizer = new JavaScriptOptimizer();

// Initialize optimization
export const initJavaScriptOptimization = () => {
  if (typeof window === 'undefined') return;

  // Set up conditional loading
  jsOptimizer.initializeConditionalLoading();

  // Disable navigation tracking to prevent conflicts with React Router
  // The route-based preloading was causing pathname redefinition errors
  // during BrowserRouter initialization. We'll rely on conditional loading instead.
  
  console.log('JavaScript optimization initialized with conditional loading only');
};