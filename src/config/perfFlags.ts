// Performance feature flags for safe rollback
export const PERF_FLAGS = {
  // Main safety switch - when true, disables risky optimizations
  SAFE_MODE: true,
  
  // Lazy loading controls
  LAZY_MARKETPLACE: false,
  LAZY_HELP_COMPONENTS: false,
  
  // Content optimization controls
  CONTENT_VISIBILITY: false,
  CRITICAL_CONTENT_WRAPPERS: false,
  
  // Runtime optimization controls
  TASK_SCHEDULER: false,
  NETWORK_OPTIMIZATIONS: false,
  CSS_OPTIMIZATIONS: false,
  
  // Development diagnostics
  DEV_TIMING: process.env.NODE_ENV === 'development'
} as const;

// Helper to check if we should use safe/synchronous rendering
export const useSafeMode = () => PERF_FLAGS.SAFE_MODE;
export const shouldLazyLoad = (component: keyof typeof PERF_FLAGS) => 
  !PERF_FLAGS.SAFE_MODE && PERF_FLAGS[component];