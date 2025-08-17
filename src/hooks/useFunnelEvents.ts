
import { useEffect } from 'react';
import { useFunnelTracking } from './useFunnelTracking';

export const useFunnelEvents = () => {
  const { trackEvent } = useFunnelTracking();

  // Track page views
  useEffect(() => {
    const trackPageView = () => {
      const path = window.location.pathname;
      
      if (path === '/pricing') {
        trackEvent({ event_name: 'view_pricing' });
      } else if (path === '/auth') {
        trackEvent({ event_name: 'view_auth_page' });
      } else if (path === '/payment-success') {
        trackEvent({ event_name: 'payment_success_viewed' });
      }
    };

    trackPageView();
    
    // Track navigation changes
    const handlePopState = () => trackPageView();
    window.addEventListener('popstate', handlePopState);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, [trackEvent]);

  const trackTrialClick = () => {
    trackEvent({ 
      event_name: 'cta_start_trial_click',
      metadata: { source: 'pricing_page' }
    });
  };

  const trackSignupStart = () => {
    trackEvent({ event_name: 'auth_signup_start' });
  };

  const trackSignupSuccess = () => {
    trackEvent({ event_name: 'auth_signup_success' });
  };

  const trackCheckoutCreated = (sessionId?: string) => {
    trackEvent({ 
      event_name: 'checkout_session_created',
      metadata: { session_id: sessionId }
    });
  };

  const trackCheckoutCompleted = () => {
    trackEvent({ event_name: 'checkout_completed' });
  };

  const trackSubscriptionActive = () => {
    trackEvent({ event_name: 'subscription_active' });
  };

  return {
    trackTrialClick,
    trackSignupStart,
    trackSignupSuccess,
    trackCheckoutCreated,
    trackCheckoutCompleted,
    trackSubscriptionActive,
  };
};
