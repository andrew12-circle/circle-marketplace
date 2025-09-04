import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SessionInfo {
  id: string;
  session_id: string;
  ip_address: string;
  user_agent: string;
  last_activity: string;
  created_at: string;
}

interface SessionWarning {
  type: 'concurrent_sessions' | 'ip_change' | 'device_change';
  message: string;
  data?: any;
}

export function useSessionManagement() {
  const { user, session } = useAuth();
  const [activeSessions, setActiveSessions] = useState<SessionInfo[]>([]);
  const [sessionWarning, setSessionWarning] = useState<SessionWarning | null>(null);
  const [currentSessionId] = useState(() => generateSessionId());
  const heartbeatInterval = useRef<NodeJS.Timeout>();
  const lastIP = useRef<string>();

  function generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper functions for tracking dismissed warnings in current session
  const getDismissedWarningsKey = () => `dismissed_warnings_${user?.id || 'anonymous'}`;
  
  const isWarningDismissed = (warningType: string): boolean => {
    try {
      const dismissed = sessionStorage.getItem(getDismissedWarningsKey());
      if (!dismissed) return false;
      const dismissedTypes = JSON.parse(dismissed) as string[];
      return dismissedTypes.includes(warningType);
    } catch {
      return false;
    }
  };

  const markWarningAsDismissed = (warningType: string) => {
    try {
      const key = getDismissedWarningsKey();
      const dismissed = sessionStorage.getItem(key);
      let dismissedTypes: string[] = [];
      
      if (dismissed) {
        dismissedTypes = JSON.parse(dismissed) as string[];
      }
      
      if (!dismissedTypes.includes(warningType)) {
        dismissedTypes.push(warningType);
        sessionStorage.setItem(key, JSON.stringify(dismissedTypes));
      }
    } catch (error) {
      console.warn('Failed to save dismissed warning state:', error);
    }
  };

  function generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('fingerprint', 2, 2);
    
    const fingerprint = {
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      canvas: canvas.toDataURL(),
      userAgent: navigator.userAgent.substring(0, 100) // Truncate for storage
    };
    
    return btoa(JSON.stringify(fingerprint)).substring(0, 50);
  }

  async function callSessionAPI(action: string, data: any = {}) {
    if (!session?.access_token) {
      console.warn('No valid session for session API call');
      return null;
    }

    try {
      const response = await supabase.functions.invoke('session-control', {
        body: { action, ...data },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Session API error');
      }

      return response.data;
    } catch (error) {
      console.warn('Session API call failed:', error);
      return null;
    }
  }

  async function startSession() {
    if (!user || !session) return;

    try {
      const deviceFingerprint = generateDeviceFingerprint();
      
      const result = await callSessionAPI('start', {
        sessionId: currentSessionId,
        deviceFingerprint,
        userAgent: navigator.userAgent,
        locationData: {
          timestamp: new Date().toISOString()
        }
      });

      if (result && result.warning && !isWarningDismissed('concurrent_sessions')) {
        setSessionWarning({
          type: 'concurrent_sessions',
          message: result.warning,
          data: { activeSessions: result.activeSessions, maxSessions: result.maxSessions }
        });
      }

      // Start heartbeat only if session start was successful
      if (result && heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      
      if (result) {
        heartbeatInterval.current = setInterval(async () => {
          if (session?.access_token) {
            await callSessionAPI('heartbeat', { sessionId: currentSessionId });
          }
        }, 30000); // Every 30 seconds
      }

    } catch (error: any) {
      if (error.message?.includes('Maximum concurrent sessions exceeded') && !isWarningDismissed('concurrent_sessions')) {
        setSessionWarning({
          type: 'concurrent_sessions',
          message: 'Too many active sessions. Please log out from other devices.',
          data: error
        });
      }
      console.error('Failed to start session:', error);
    }
  }

  async function endSession() {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = undefined;
    }

    // Only try to end session if we have a valid session
    if (session?.access_token) {
      await callSessionAPI('end', { sessionId: currentSessionId });
    }
  }

  async function loadActiveSessions() {
    if (!user || !session) return;

    const result = await callSessionAPI('list');
    if (result && result.sessions) {
      setActiveSessions(result.sessions);
    }
  }

  async function revokeSessions(sessionIds: string[]) {
    if (!session?.access_token) {
      throw new Error('No valid session');
    }
    
    const result = await callSessionAPI('revoke', { sessionIds });
    if (result) {
      await loadActiveSessions(); // Refresh the list
    }
  }

  function dismissWarning() {
    if (sessionWarning) {
      // Mark this warning type as dismissed for the current session
      markWarningAsDismissed(sessionWarning.type);
      setSessionWarning(null);
    }
  }

  // Initialize session when user logs in
  useEffect(() => {
    if (user && session) {
      startSession();
      loadActiveSessions();
    } else {
      endSession();
      setActiveSessions([]);
      setSessionWarning(null);
      // Clear dismissed warnings when logging out
      try {
        sessionStorage.removeItem(getDismissedWarningsKey());
      } catch (error) {
        console.warn('Failed to clear dismissed warnings on logout:', error);
      }
    }

    return () => {
      endSession();
    };
  }, [user, session]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        // Page is hidden, reduce heartbeat frequency or pause
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
        }
      } else {
        // Page is visible, resume heartbeat
        if (user && session) {
          startSession();
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, session]);

  return {
    activeSessions,
    sessionWarning,
    currentSessionId,
    loadActiveSessions,
    revokeSessions,
    dismissWarning,
    startSession,
    endSession
  };
}