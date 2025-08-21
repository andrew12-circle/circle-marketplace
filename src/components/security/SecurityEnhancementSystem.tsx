import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityContextType {
  isSecurityMonitoringEnabled: boolean;
  rateLimitRemaining: number;
  sessionValid: boolean;
  lastSecurityCheck: Date | null;
  performSecurityCheck: () => Promise<void>;
  logSecurityEvent: (eventType: string, eventData?: Record<string, any>) => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType>({
  isSecurityMonitoringEnabled: false,
  rateLimitRemaining: 100,
  sessionValid: true,
  lastSecurityCheck: null,
  performSecurityCheck: async () => {},
  logSecurityEvent: async () => {},
});

export const useSecurityMonitoring = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityMonitoring must be used within SecurityProvider');
  }
  return context;
};

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSecurityMonitoringEnabled, setIsSecurityMonitoringEnabled] = useState(false);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(100);
  const [sessionValid, setSessionValid] = useState(true);
  const [lastSecurityCheck, setLastSecurityCheck] = useState<Date | null>(null);
  const { toast } = useToast();
  const location = useLocation();
  const { profile } = useAuth();

  // Track recent events for throttling
  const recentEventsRef = React.useRef(new Set<string>());

  // Check if we should perform security monitoring for this route/user
  const shouldPerformSecurityChecks = () => {
    // Only perform intensive security checks for admin users or admin routes
    const isAdminRoute = location.pathname.startsWith('/admin') || 
                        location.pathname.startsWith('/command-center') ||
                        location.pathname.startsWith('/compliance');
    
    const isAdminUser = profile?.is_admin === true;
    
    return isAdminRoute || isAdminUser;
  };

  const performSecurityCheck = async () => {
    // Skip intensive security checks if not needed
    if (!shouldPerformSecurityChecks()) {
      setSessionValid(true);
      setLastSecurityCheck(new Date());
      return;
    }

    try {
      // Check if user session is still valid
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setSessionValid(false);
        return;
      }

      if (session) {
        // Only verify admin session context if user is actually admin
        if (profile?.is_admin) {
          const { data, error: contextError } = await supabase.rpc('validate_admin_session_context');
          
          if (contextError || !data) {
            setSessionValid(false);
            toast({
              title: "Security Alert",
              description: "Admin session validation failed. Please re-authenticate.",
              variant: "destructive",
            });
            return;
          }
        }

        // Check rate limits using the new RPC
        const { data: rateLimitData } = await supabase.rpc('check_security_operation_rate_limit');
        setRateLimitRemaining(rateLimitData ? 50 : 0); // Updated to match RPC logic

        setSessionValid(true);
        setLastSecurityCheck(new Date());
      }
    } catch (error) {
      console.error('Security check failed:', error);
      // Don't mark as invalid on error - could be network issue
      if (shouldPerformSecurityChecks()) {
        setSessionValid(false);
      }
    }
  };

  // Rate-limited security event logging
  const logSecurityEvent = async (eventType: string, eventData: Record<string, any> = {}) => {
    // Skip logging for non-security-critical routes/users
    if (!shouldPerformSecurityChecks()) {
      return;
    }

    // Simple in-memory throttle to prevent spam
    const eventKey = `${eventType}_${Date.now() - (Date.now() % 10000)}`; // 10 second windows
    if (recentEventsRef.current.has(eventKey)) {
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('security_events').insert({
          event_type: eventType,
          user_id: user.id,
          event_data: {
            ...eventData,
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent,
            url: window.location.href,
          },
        });
        
        // Track this event to prevent spam
        recentEventsRef.current.add(eventKey);
        
        // Clean up old events
        setTimeout(() => recentEventsRef.current.delete(eventKey), 30000);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  useEffect(() => {
    // Only enable monitoring if security checks are needed
    const needsMonitoring = shouldPerformSecurityChecks();
    setIsSecurityMonitoringEnabled(needsMonitoring);
    
    if (!needsMonitoring) {
      return; // Skip all monitoring for regular users/routes
    }
    
    // Perform initial security check
    performSecurityCheck();
    
    // Set up periodic security checks every 15 minutes (further reduced)
    const securityInterval = setInterval(performSecurityCheck, 15 * 60 * 1000);
    
    // Set up auth state change monitoring (less aggressive)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          await performSecurityCheck();
        }
        
        // Log authentication events (throttled)
        await logSecurityEvent(`auth_${event}`, {
          session_exists: !!session,
        });
      }
    );

    // Only monitor visibility for admin routes/users
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && shouldPerformSecurityChecks()) {
        performSecurityCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(securityInterval);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname, profile?.is_admin]); // Re-run when route or admin status changes

  return (
    <SecurityContext.Provider
      value={{
        isSecurityMonitoringEnabled,
        rateLimitRemaining,
        sessionValid,
        lastSecurityCheck,
        performSecurityCheck,
        logSecurityEvent,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

// Security-enhanced form wrapper
export const SecureFormWrapper: React.FC<{
  children: React.ReactNode;
  onSubmit: (data: FormData) => Promise<void>;
  requiresAuth?: boolean;
}> = ({ children, onSubmit, requiresAuth = true }) => {
  const { sessionValid, logSecurityEvent } = useSecurityMonitoring();
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (requiresAuth && !sessionValid) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    
    // Log form submission for security monitoring
    await logSecurityEvent('form_submission', {
      form_action: event.currentTarget.action,
      field_count: Array.from(formData.keys()).length,
    });

    try {
      await onSubmit(formData);
    } catch (error) {
      await logSecurityEvent('form_submission_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {children}
    </form>
  );
};

// Security status indicator component
export const SecurityStatusIndicator: React.FC = () => {
  const { sessionValid, rateLimitRemaining, lastSecurityCheck } = useSecurityMonitoring();

  if (!sessionValid) {
    return (
      <div className="flex items-center space-x-2 text-destructive">
        <div className="w-2 h-2 bg-destructive rounded-full"></div>
        <span className="text-sm">Security Alert</span>
      </div>
    );
  }

  if (rateLimitRemaining < 5) {
    return (
      <div className="flex items-center space-x-2 text-warning">
        <div className="w-2 h-2 bg-warning rounded-full"></div>
        <span className="text-sm">Rate Limit Warning</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-success">
      <div className="w-2 h-2 bg-success rounded-full"></div>
      <span className="text-sm">
        Secure ({lastSecurityCheck?.toLocaleTimeString()})
      </span>
    </div>
  );
};