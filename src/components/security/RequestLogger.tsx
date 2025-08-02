import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const RequestLogger = () => {
  useEffect(() => {
    // Function to log requests to detect scraping
    const logRequest = async (endpoint: string, method: string = 'GET', responseStatus: number = 200) => {
      try {
        await supabase.functions.invoke('detect-scraping', {
          body: {
            action: 'log_request',
            endpoint,
            method,
            response_status: responseStatus,
            request_size: 0,
            response_time_ms: performance.now()
          }
        });
      } catch (error) {
        // Silently fail to avoid blocking legitimate requests
        console.debug('Request logging failed:', error);
      }
    };

    // Log initial page load
    logRequest(window.location.pathname);

    // Intercept fetch requests to log them
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const startTime = performance.now();
      const url = args[0] as string;
      const options = args[1] as RequestInit;
      
      try {
        const response = await originalFetch.apply(this, args);
        const endTime = performance.now();
        
        // Only log external API calls and Supabase requests
        if (url.includes('supabase.co') || url.startsWith('http')) {
          logRequest(
            url.includes('supabase.co') ? 'api-call' : url,
            options?.method || 'GET',
            response.status
          );
        }
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        logRequest(
          url.includes('supabase.co') ? 'api-call' : url,
          options?.method || 'GET',
          500
        );
        throw error;
      }
    };

    // Log navigation changes
    const handleRouteChange = () => {
      logRequest(window.location.pathname);
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);

    // Override pushState and replaceState to catch programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      handleRouteChange();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      handleRouteChange();
    };

    // Cleanup function
    return () => {
      window.fetch = originalFetch;
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  return null; // This component doesn't render anything
};

export default RequestLogger;