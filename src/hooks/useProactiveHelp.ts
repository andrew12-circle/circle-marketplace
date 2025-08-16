import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface UserBehaviorPattern {
  timeOnPage: number;
  clicksWithoutAction: number;
  errorCount: number;
  pageReloads: number;
  backButtonUsage: number;
  searchAttempts: number;
  lastActivity: number;
}

interface ProactiveHelpTrigger {
  type: 'stuck_pattern' | 'error_pattern' | 'confusion_indicator' | 'feature_discovery';
  confidence: number;
  data: any;
}

export const useProactiveHelp = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [behaviorPattern, setBehaviorPattern] = useState<UserBehaviorPattern>({
    timeOnPage: 0,
    clicksWithoutAction: 0,
    errorCount: 0,
    pageReloads: 0,
    backButtonUsage: 0,
    searchAttempts: 0,
    lastActivity: Date.now()
  });
  const [triggers, setTriggers] = useState<ProactiveHelpTrigger[]>([]);

  // Track user behavior patterns
  const trackBehavior = useCallback((action: string, data?: any) => {
    setBehaviorPattern(prev => {
      const updated = { ...prev, lastActivity: Date.now() };
      
      switch (action) {
        case 'click':
          updated.clicksWithoutAction += 1;
          break;
        case 'action':
          updated.clicksWithoutAction = 0; // Reset on successful action
          break;
        case 'error':
          updated.errorCount += 1;
          break;
        case 'reload':
          updated.pageReloads += 1;
          break;
        case 'back':
          updated.backButtonUsage += 1;
          break;
        case 'search':
          updated.searchAttempts += 1;
          break;
        case 'reset':
          return {
            timeOnPage: 0,
            clicksWithoutAction: 0,
            errorCount: 0,
            pageReloads: 0,
            backButtonUsage: 0,
            searchAttempts: 0,
            lastActivity: Date.now()
          };
      }
      
      return updated;
    });
  }, []);

  // Analyze behavior and generate triggers
  const analyzeBehavior = useCallback(() => {
    const triggers: ProactiveHelpTrigger[] = [];
    const timeOnPage = Date.now() - (behaviorPattern.lastActivity - behaviorPattern.timeOnPage);

    // Stuck pattern detection
    if (behaviorPattern.clicksWithoutAction > 5 && timeOnPage > 60000) {
      triggers.push({
        type: 'stuck_pattern',
        confidence: 0.8,
        data: {
          timeOnPage,
          clicksWithoutAction: behaviorPattern.clicksWithoutAction,
          route: location.pathname
        }
      });
    }

    // Error pattern detection
    if (behaviorPattern.errorCount > 2) {
      triggers.push({
        type: 'error_pattern',
        confidence: 0.9,
        data: {
          errorCount: behaviorPattern.errorCount,
          pageReloads: behaviorPattern.pageReloads,
          route: location.pathname
        }
      });
    }

    // Confusion indicator
    if (behaviorPattern.searchAttempts > 3 && behaviorPattern.clicksWithoutAction > 3) {
      triggers.push({
        type: 'confusion_indicator',
        confidence: 0.7,
        data: {
          searchAttempts: behaviorPattern.searchAttempts,
          clicksWithoutAction: behaviorPattern.clicksWithoutAction,
          route: location.pathname
        }
      });
    }

    // Feature discovery opportunities
    if (timeOnPage > 120000 && behaviorPattern.clicksWithoutAction < 3) {
      triggers.push({
        type: 'feature_discovery',
        confidence: 0.6,
        data: {
          timeOnPage,
          route: location.pathname,
          engagementLevel: 'high'
        }
      });
    }

    setTriggers(triggers);
    return triggers;
  }, [behaviorPattern, location.pathname]);

  // Send triggers to backend for processing
  const submitTriggers = useCallback(async (triggers: ProactiveHelpTrigger[]) => {
    if (!user?.id || triggers.length === 0) return;

    try {
      for (const trigger of triggers) {
        await supabase
          .from('help_proactive_triggers')
          .insert({
            user_id: user.id,
            trigger_type: trigger.type,
            trigger_data: trigger.data
          });
      }
    } catch (error) {
      console.error('Error submitting proactive help triggers:', error);
    }
  }, [user?.id]);

  // Monitor inactivity
  useEffect(() => {
    const updateTimeOnPage = () => {
      setBehaviorPattern(prev => ({
        ...prev,
        timeOnPage: Date.now() - prev.lastActivity
      }));
    };

    const interval = setInterval(updateTimeOnPage, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Analyze behavior periodically
  useEffect(() => {
    const analyzeInterval = setInterval(() => {
      const triggers = analyzeBehavior();
      if (triggers.length > 0) {
        submitTriggers(triggers);
      }
    }, 30000); // Analyze every 30 seconds

    return () => clearInterval(analyzeInterval);
  }, [analyzeBehavior, submitTriggers]);

  // Reset pattern on route change
  useEffect(() => {
    trackBehavior('reset');
  }, [location.pathname, trackBehavior]);

  // Set up event listeners for behavior tracking
  useEffect(() => {
    const handleClick = () => trackBehavior('click');
    const handleError = () => trackBehavior('error');
    const handlePopState = () => trackBehavior('back');

    document.addEventListener('click', handleClick);
    window.addEventListener('error', handleError);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('error', handleError);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [trackBehavior]);

  return {
    behaviorPattern,
    triggers,
    trackBehavior,
    analyzeBehavior,
    isStuck: triggers.some(t => t.type === 'stuck_pattern' && t.confidence > 0.7),
    hasErrors: triggers.some(t => t.type === 'error_pattern' && t.confidence > 0.8),
    needsGuidance: triggers.some(t => t.type === 'confusion_indicator' && t.confidence > 0.6),
    canDiscoverFeatures: triggers.some(t => t.type === 'feature_discovery' && t.confidence > 0.5)
  };
};