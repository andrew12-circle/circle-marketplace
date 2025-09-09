// PostHog Rate Limiting & Throttling System
// Prevents console spam from PostHog rate limiting errors

import { analyticsConfig, isPostHogEnabled, isStrictThrottling, shouldThrottleAdminRoutes } from './environment';

interface PostHogConfig {
  enabled: boolean;
  maxEventsPerSecond: number;
  maxEventsPerMinute: number;
  debounceMs: number;
  adminRouteThrottling: boolean;
  strictMode: boolean;
}

class PostHogThrottler {
  private config: PostHogConfig;
  private tokenBucket: { tokens: number; lastRefill: number };
  private eventCounts: { perSecond: number; perMinute: number; lastSecondReset: number; lastMinuteReset: number };
  private debouncedEvents: Map<string, NodeJS.Timeout>;
  private originalCapture: any;

  constructor() {
    this.config = {
      enabled: isPostHogEnabled,
      maxEventsPerSecond: analyticsConfig.posthog.maxEventsPerSecond,
      maxEventsPerMinute: analyticsConfig.posthog.maxEventsPerMinute,
      debounceMs: analyticsConfig.posthog.debounceMs,
      adminRouteThrottling: shouldThrottleAdminRoutes,
      strictMode: isStrictThrottling
    };

    this.tokenBucket = {
      tokens: this.config.maxEventsPerSecond,
      lastRefill: Date.now()
    };

    this.eventCounts = {
      perSecond: 0,
      perMinute: 0,
      lastSecondReset: Date.now(),
      lastMinuteReset: Date.now()
    };

    this.debouncedEvents = new Map();
    this.originalCapture = null;

    this.initialize();
  }

  private initialize() {
    // Wait for PostHog to be available
    const checkForPostHog = () => {
      if (typeof window !== 'undefined' && (window as any).posthog) {
        this.patchPostHog();
      } else {
        setTimeout(checkForPostHog, 100);
      }
    };

    if (typeof window !== 'undefined') {
      // Check immediately and also on DOM ready
      checkForPostHog();
      
      // Also check when document is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkForPostHog);
      }
    }
  }

  private patchPostHog() {
    const posthog = (window as any).posthog;
    if (!posthog || this.originalCapture) return;

    console.log('🚀 PostHog throttling initialized');
    
    this.originalCapture = posthog.capture.bind(posthog);
    
    posthog.capture = (event: string, properties?: any, options?: any) => {
      if (!this.shouldAllowEvent(event, properties)) {
        return;
      }

      try {
        this.originalCapture(event, properties, options);
      } catch (error) {
        // Silently handle PostHog errors to prevent console spam
        if (process.env.NODE_ENV === 'development') {
          console.debug('PostHog capture throttled:', event);
        }
      }
    };
  }

  private shouldAllowEvent(event: string, properties?: any): boolean {
    // If PostHog is disabled completely, block all events
    if (!this.config.enabled) {
      return false;
    }

    // Check if we're on an admin route and throttling is enabled
    if (this.config.adminRouteThrottling && 
        typeof window !== 'undefined' && 
        window.location.pathname.startsWith('/admin')) {
      
      // In strict mode, be extra restrictive on admin routes
      const tokensNeeded = this.config.strictMode ? 0.25 : 0.5;
      if (!this.checkTokenBucket(tokensNeeded)) {
        return false;
      }
    } else {
      // Standard token consumption
      const tokensNeeded = this.config.strictMode ? 0.5 : 1;
      if (!this.checkTokenBucket(tokensNeeded)) {
        return false;
      }
    }

    // Check rate limits
    if (!this.checkRateLimits()) {
      return false;
    }

    // Block search/input events that are not submit events
    if (this.isSearchOrInputEvent(event, properties)) {
      return false;
    }

    // Debounce similar events
    if (this.shouldDebounce(event, properties)) {
      return false;
    }

    this.consumeEvent(event, properties);
    return true;
  }

  private isSearchOrInputEvent(event: string, properties?: any): boolean {
    const searchEvents = [
      'search',
      'input',
      'keydown', 
      'keyup',
      'typing',
      'autocomplete'
    ];
    
    // Block search events unless they're explicit submit events
    if (searchEvents.some(searchEvent => event.toLowerCase().includes(searchEvent))) {
      // Allow if it's explicitly a submit event
      return !event.toLowerCase().includes('submit');
    }
    
    return false;
  }

  private checkTokenBucket(tokensNeeded: number): boolean {
    const now = Date.now();
    const timeSinceRefill = now - this.tokenBucket.lastRefill;
    
    // Refill tokens based on time passed
    if (timeSinceRefill > 0) {
      const tokensToAdd = (timeSinceRefill / 1000) * this.config.maxEventsPerSecond;
      this.tokenBucket.tokens = Math.min(
        this.config.maxEventsPerSecond,
        this.tokenBucket.tokens + tokensToAdd
      );
      this.tokenBucket.lastRefill = now;
    }

    if (this.tokenBucket.tokens >= tokensNeeded) {
      this.tokenBucket.tokens -= tokensNeeded;
      return true;
    }

    return false;
  }

  private checkRateLimits(): boolean {
    const now = Date.now();

    // Reset counters if time windows have passed
    if (now - this.eventCounts.lastSecondReset > 1000) {
      this.eventCounts.perSecond = 0;
      this.eventCounts.lastSecondReset = now;
    }

    if (now - this.eventCounts.lastMinuteReset > 60000) {
      this.eventCounts.perMinute = 0;
      this.eventCounts.lastMinuteReset = now;
    }

    return this.eventCounts.perSecond < this.config.maxEventsPerSecond &&
           this.eventCounts.perMinute < this.config.maxEventsPerMinute;
  }

  private shouldDebounce(event: string, properties?: any): boolean {
    const eventKey = `${event}:${JSON.stringify(properties || {})}`;
    
    if (this.debouncedEvents.has(eventKey)) {
      return true; // Already debouncing this event
    }

    // Set debounce timeout
    const timeout = setTimeout(() => {
      this.debouncedEvents.delete(eventKey);
    }, this.config.debounceMs);

    this.debouncedEvents.set(eventKey, timeout);
    return false;
  }

  private consumeEvent(event: string, properties?: any) {
    this.eventCounts.perSecond++;
    this.eventCounts.perMinute++;
  }

  // Public methods for configuration
  public updateConfig(newConfig: Partial<PostHogConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getStats() {
    return {
      config: this.config,
      tokenBucket: this.tokenBucket,
      eventCounts: this.eventCounts,
      debouncedEventsCount: this.debouncedEvents.size
    };
  }

  public disable() {
    this.config.enabled = false;
    
    // Restore original PostHog if we patched it
    if (this.originalCapture && typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture = this.originalCapture;
      this.originalCapture = null;
    }
  }
}

// Create and export singleton instance
export const postHogThrottler = new PostHogThrottler();

// Export for debugging in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).postHogThrottler = postHogThrottler;
}