import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface HelpMetrics {
  pageViews: number;
  timeOnPage: number;
  errorCount: number;
  lastActivity: Date;
}

interface HelpContext {
  currentRoute: string;
  userBehavior: {
    isStuck: boolean;
    hasErrors: boolean;
    needsHelp: boolean;
  };
  metrics: HelpMetrics;
}

export const useHelpContext = () => {
  const location = useLocation();
  const [context, setContext] = useState<HelpContext>({
    currentRoute: location.pathname,
    userBehavior: {
      isStuck: false,
      hasErrors: false,
      needsHelp: false
    },
    metrics: {
      pageViews: 0,
      timeOnPage: 0,
      errorCount: 0,
      lastActivity: new Date()
    }
  });

  const [pageStartTime] = useState(Date.now());
  const [activityTimer, setActivityTimer] = useState<NodeJS.Timeout | null>(null);

  // Track page views and time
  useEffect(() => {
    setContext(prev => ({
      ...prev,
      currentRoute: location.pathname,
      metrics: {
        ...prev.metrics,
        pageViews: prev.metrics.pageViews + 1,
        lastActivity: new Date()
      }
    }));
  }, [location.pathname]);

  // Track time on page
  useEffect(() => {
    const interval = setInterval(() => {
      setContext(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          timeOnPage: Date.now() - pageStartTime
        }
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [pageStartTime]);

  // Track user activity for "stuck" detection
  const trackActivity = useCallback(() => {
    setContext(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        lastActivity: new Date()
      },
      userBehavior: {
        ...prev.userBehavior,
        isStuck: false
      }
    }));

    // Reset inactivity timer
    if (activityTimer) {
      clearTimeout(activityTimer);
    }

    // Set new timer for stuck detection (30 seconds of inactivity)
    const newTimer = setTimeout(() => {
      setContext(prev => ({
        ...prev,
        userBehavior: {
          ...prev.userBehavior,
          isStuck: prev.metrics.timeOnPage > 30000 // 30 seconds on page with no activity
        }
      }));
    }, 30000);

    setActivityTimer(newTimer);
  }, [activityTimer]);

  // Track errors
  const reportError = useCallback((error: Error) => {
    setContext(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        errorCount: prev.metrics.errorCount + 1
      },
      userBehavior: {
        ...prev.userBehavior,
        hasErrors: true,
        needsHelp: prev.metrics.errorCount >= 2 // Suggest help after 3+ errors
      }
    }));
  }, []);

  // Determine if user might need help
  const shouldOfferHelp = useCallback(() => {
    const { userBehavior, metrics } = context;
    
    return (
      userBehavior.isStuck ||
      userBehavior.hasErrors ||
      (metrics.timeOnPage > 60000 && metrics.pageViews === 1) || // 1 min on single page
      metrics.errorCount >= 2
    );
  }, [context]);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, trackActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
      if (activityTimer) {
        clearTimeout(activityTimer);
      }
    };
  }, [trackActivity, activityTimer]);

  return {
    context,
    reportError,
    shouldOfferHelp,
    trackActivity
  };
};