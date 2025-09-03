import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hasAnalyticsConsent, respectsDoNotTrack } from "@/lib/consent";

interface MobileTrackingOptions {
  trackPageViews?: boolean;
  trackClicks?: boolean;
  trackFormSubmissions?: boolean;
  sessionTimeout?: number; // in minutes
}

interface DeviceInfo {
  platform: string;
  device_model?: string;
  os_version?: string;
  screen_size?: string;
  connection_type?: string;
  app_version?: string;
}

export const useMobileTracking = (options: MobileTrackingOptions = {}) => {
  const [sessionId, setSessionId] = useState<string>("");
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);

  const {
    trackPageViews = true,
    trackClicks = true,
    trackFormSubmissions = true,
    sessionTimeout = 30
  } = options;

  useEffect(() => {
    initializeTracking();
  }, []);

  const initializeTracking = async () => {
    // Generate or retrieve session ID
    let storedSessionId = localStorage.getItem('mobile_session_id');
    const sessionExpiry = localStorage.getItem('mobile_session_expiry');
    
    if (!storedSessionId || (sessionExpiry && new Date() > new Date(sessionExpiry))) {
      storedSessionId = generateSessionId();
      localStorage.setItem('mobile_session_id', storedSessionId);
      
      const expiry = new Date(Date.now() + sessionTimeout * 60 * 1000);
      localStorage.setItem('mobile_session_expiry', expiry.toISOString());
    }
    
    setSessionId(storedSessionId);

    // Detect device information
    const deviceData = await detectDeviceInfo();
    setDeviceInfo(deviceData);

    // Check for affiliate attribution
    const attribution = localStorage.getItem('affiliate_attribution');
    if (attribution) {
      try {
        const parsed = JSON.parse(attribution);
        setAffiliateId(parsed.affiliateId);
      } catch (error) {
        console.error('Error parsing affiliate attribution:', error);
      }
    }

    // Set up tracking listeners
    if (trackPageViews) {
      trackEvent('page_view', { url: window.location.href });
    }

    if (trackClicks) {
      setupClickTracking();
    }

    if (trackFormSubmissions) {
      setupFormTracking();
    }
  };

  const generateSessionId = (): string => {
    return `mobile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const detectDeviceInfo = async (): Promise<DeviceInfo> => {
    const userAgent = navigator.userAgent;
    const platform = detectPlatform(userAgent);
    
    return {
      platform,
      device_model: getDeviceModel(userAgent),
      os_version: getOSVersion(userAgent),
      screen_size: `${window.screen.width}x${window.screen.height}`,
      connection_type: getConnectionType(),
      app_version: getAppVersion()
    };
  };

  const detectPlatform = (userAgent: string): string => {
    if (/Android/i.test(userAgent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    if (/Windows Phone/i.test(userAgent)) return 'windows_phone';
    return 'web';
  };

  const getDeviceModel = (userAgent: string): string => {
    // Extract device model from user agent
    const androidMatch = userAgent.match(/Android.*?;\s*(.*?)\)/);
    if (androidMatch) return androidMatch[1];
    
    const iosMatch = userAgent.match(/(iPhone|iPad|iPod)/);
    if (iosMatch) return iosMatch[1];
    
    return 'unknown';
  };

  const getOSVersion = (userAgent: string): string => {
    const androidMatch = userAgent.match(/Android\s+([\d.]+)/);
    if (androidMatch) return `Android ${androidMatch[1]}`;
    
    const iosMatch = userAgent.match(/OS\s+([\d_]+)/);
    if (iosMatch) return `iOS ${iosMatch[1].replace(/_/g, '.')}`;
    
    return 'unknown';
  };

  const getConnectionType = (): string => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      return connection.effectiveType || connection.type || 'unknown';
    }
    return 'unknown';
  };

  const getAppVersion = (): string => {
    // This would be set by the app build process
    return process.env.REACT_APP_VERSION || '1.0.0';
  };

  const trackEvent = async (eventType: string, eventData: Record<string, any> = {}) => {
    // Respect user's tracking preferences and Do Not Track
    if (!sessionId || !deviceInfo || respectsDoNotTrack() || !hasAnalyticsConsent()) {
      console.log('Tracking disabled by user preferences or Do Not Track');
      return;
    }

    try {
      await supabase.functions.invoke('affiliate-fraud-detection/mobile-tracking', {
        body: {
          session_id: sessionId,
          affiliate_id: affiliateId,
          event_type: eventType,
          device_info: {
            ...deviceInfo,
            ...eventData
          },
          platform: deviceInfo.platform
        }
      });
      
      console.log(`Mobile tracking: ${eventType}`, eventData);
    } catch (error) {
      console.error('Failed to track mobile event:', error);
    }
  };

  const setupClickTracking = () => {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const isLink = tagName === 'a';
      const isButton = tagName === 'button' || target.closest('button');
      
      if (isLink || isButton) {
        const elementText = target.textContent?.trim().substring(0, 50) || '';
        const href = isLink ? (target as HTMLAnchorElement).href : '';
        
        trackEvent('click', {
          element_type: tagName,
          element_text: elementText,
          href: href,
          is_affiliate_link: href.includes('aff='),
          page_url: window.location.href
        });
      }
    });
  };

  const setupFormTracking = () => {
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      const formFields = Array.from(formData.keys());
      
      trackEvent('form_submission', {
        form_action: form.action || '',
        form_method: form.method || 'get',
        field_count: formFields.length,
        field_types: formFields,
        page_url: window.location.href
      });
    });
  };

  const trackCustomEvent = (eventType: string, eventData: Record<string, any> = {}) => {
    trackEvent(eventType, eventData);
  };

  const trackAffiliateClick = (affiliateCode: string, linkUrl: string) => {
    trackEvent('affiliate_click', {
      affiliate_code: affiliateCode,
      link_url: linkUrl,
      referrer: document.referrer,
      page_url: window.location.href
    });
  };

  const trackConversion = (conversionType: string, conversionData: Record<string, any> = {}) => {
    trackEvent('conversion', {
      conversion_type: conversionType,
      ...conversionData,
      page_url: window.location.href
    });
  };

  const trackPageView = (pageUrl?: string) => {
    trackEvent('page_view', {
      url: pageUrl || window.location.href,
      referrer: document.referrer,
      title: document.title
    });
  };

  const extendSession = () => {
    const expiry = new Date(Date.now() + sessionTimeout * 60 * 1000);
    localStorage.setItem('mobile_session_expiry', expiry.toISOString());
  };

  const endSession = () => {
    trackEvent('session_end');
    localStorage.removeItem('mobile_session_id');
    localStorage.removeItem('mobile_session_expiry');
  };

  return {
    sessionId,
    deviceInfo,
    affiliateId,
    trackCustomEvent,
    trackAffiliateClick,
    trackConversion,
    trackPageView,
    extendSession,
    endSession,
    isTracking: !!sessionId
  };
};