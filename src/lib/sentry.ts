import * as Sentry from "@sentry/react";

export const initSentry = () => {
  // Get DSN from Supabase secrets (will be undefined in development without DSN)
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!sentryDsn) {
    console.warn("Sentry DSN not configured. Error tracking disabled.");
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE || "development",
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    
    // Performance monitoring
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
    
    // Error filtering
    beforeSend(event) {
      // Filter out development errors and known non-critical errors
      if (import.meta.env.MODE === "development") {
        console.log("Sentry event:", event);
      }
      
      // Filter out network errors that are handled gracefully
      if (event.exception?.values?.[0]?.type === "ChunkLoadError") {
        return null;
      }
      
      return event;
    },
    
    // Additional context
    initialScope: {
      tags: {
        component: "Circle Platform"
      }
    }
  });
};

// Export Sentry for use in components
export { Sentry };