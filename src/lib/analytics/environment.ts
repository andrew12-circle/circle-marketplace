// Environment configuration for analytics and PostHog
export const analyticsConfig = {
  // PostHog Configuration
  posthog: {
    // Disable PostHog completely if needed
    enabled: process.env.REACT_APP_POSTHOG_DISABLE !== 'true',
    
    // Strict throttling mode for development/admin routes
    strictThrottling: process.env.REACT_APP_POSTHOG_STRICT === 'true' || 
                     process.env.NODE_ENV === 'development',
    
    // Rate limits
    maxEventsPerSecond: parseInt(process.env.REACT_APP_POSTHOG_MAX_PER_SECOND || '5'),
    maxEventsPerMinute: parseInt(process.env.REACT_APP_POSTHOG_MAX_PER_MINUTE || '50'),
    
    // Debounce similar events
    debounceMs: parseInt(process.env.REACT_APP_POSTHOG_DEBOUNCE_MS || '500'),
    
    // Admin route specific throttling
    adminRouteThrottling: process.env.REACT_APP_POSTHOG_ADMIN_THROTTLE !== 'false'
  },
  
  // Internal analytics (Supabase events) - not affected by PostHog throttling
  internal: {
    enabled: true,
    onSubmitOnly: true // Only log analytics on form submit, not on typing
  }
};

// Export individual settings for easy access
export const isPostHogEnabled = analyticsConfig.posthog.enabled;
export const isStrictThrottling = analyticsConfig.posthog.strictThrottling;
export const shouldThrottleAdminRoutes = analyticsConfig.posthog.adminRouteThrottling;

// Debug helper
export const getAnalyticsDebugInfo = () => ({
  environment: process.env.NODE_ENV,
  posthogEnabled: isPostHogEnabled,
  strictThrottling: isStrictThrottling,
  adminThrottling: shouldThrottleAdminRoutes,
  currentPath: typeof window !== 'undefined' ? window.location.pathname : 'N/A'
});