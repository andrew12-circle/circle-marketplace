import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const performSecurityCheck = async () => {
    try {
      // Check if user session is still valid
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setSessionValid(false);
        return;
      }

      if (session) {
        // Verify session context if user has admin privileges
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('user_id', session.user.id)
          .single();

        if (profile?.is_admin) {
          const { data, error: contextError } = await supabase.rpc('validate_session_context');
          
          if (contextError || !data) {
            setSessionValid(false);
            toast({
              title: "Security Alert",
              description: "Session validation failed. Please re-authenticate.",
              variant: "destructive",
            });
            return;
          }
        }

        // Check rate limits
        const { data: rateLimitData } = await supabase.rpc('check_security_operation_rate_limit');
        setRateLimitRemaining(rateLimitData ? 20 : 0);

        setSessionValid(true);
        setLastSecurityCheck(new Date());
      }
    } catch (error) {
      console.error('Security check failed:', error);
      setSessionValid(false);
    }
  };

  const logSecurityEvent = async (eventType: string, eventData: Record<string, any> = {}) => {
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
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  useEffect(() => {
    setIsSecurityMonitoringEnabled(true);
    
    // Perform initial security check
    performSecurityCheck();
    
    // Set up periodic security checks every 5 minutes
    const securityInterval = setInterval(performSecurityCheck, 5 * 60 * 1000);
    
    // Set up auth state change monitoring
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          await performSecurityCheck();
        }
        
        // Log authentication events
        await logSecurityEvent(`auth_${event}`, {
          session_exists: !!session,
        });
      }
    );

    // Log page visibility changes for security monitoring
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performSecurityCheck();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(securityInterval);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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