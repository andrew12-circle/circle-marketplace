// @ts-nocheck
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { removeLegacyAuthCookies, initCookieMonitoring } from '@/lib/cookies';

import { logger } from '@/utils/logger';
import { useQueryClient } from '@tanstack/react-query';
import { clearLegacyAuthKeys } from '@/utils/authCleanup';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import { getProStatus } from '@/lib/profile';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { SessionWarningDialog } from '@/components/session/SessionWarningDialog';
import { ActiveSessionsDialog } from '@/components/session/ActiveSessionsDialog';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  business_name: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  bio: string | null;
  website_url: string | null;
  specialties: string[] | null;
  years_experience: number | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  circle_points: number | null;
  is_pro_member: boolean | null;
  is_creator: boolean | null;
  creator_verified: boolean | null;
  is_admin: boolean | null;
  revenue_share_percentage: number | null;
  total_earnings: number | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  pro: boolean;
  loading: boolean;
  signOut: () => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  pro: false,
  loading: true,
  signOut: async () => ({ error: null }),
  updateProfile: async () => ({ error: null }),
  refreshProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [provisionalProfile, setProvisionalProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchAttempt, setLastFetchAttempt] = useState(0);
  const [isCircuitBreakerOpen, setIsCircuitBreakerOpen] = useState(false);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
  const [profileCache, setProfileCache] = useState<Map<string, { profile: Profile; timestamp: number }>>(new Map());
  const [inFlightFetches, setInFlightFetches] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { handleSessionError, triggerRecoveryBanner } = useSessionPersistence();
  const sessionManagement = useSessionManagement();

  // Helper functions for provisional profile support
  const createProvisionalProfile = useCallback((user: User): Profile => {
    const displayName = user.user_metadata?.name || 
                       user.user_metadata?.display_name || 
                       user.email?.split('@')[0] || 
                       'User';
    
    return {
      user_id: user.id,
      display_name: displayName,
      is_admin: user.email === 'andrew@circlenetwork.io',
      is_verified: false,
      is_pro: false,
      is_creator: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Profile;
  }, []);

  const ensureProfileExists = useCallback(async (userId: string) => {
    try {
      await supabase.rpc('ensure_profile_exists', { p_user_id: userId });
    } catch (error) {
      logger.warn('Could not ensure profile exists:', error);
    }
  }, []);

  // Add recovery mechanism for stuck states
  const recoverFromStuckState = useCallback(() => {
    logger.log('🔄 Attempting to recover from stuck state...');
    
    // Clear all caches
    queryClient.invalidateQueries();
    localStorage.removeItem('sb-session');
    
    // Reset retry count
    setRetryCount(0);
    
    // Force auth session refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 100);
      }
    });
  }, [queryClient]);

  // Expose recovery function globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).authRecovery = recoverFromStuckState;
    }
  }, [recoverFromStuckState]);

  const fetchProfile = async (userId: string) => {
    // Guard against undefined/invalid userId - this prevents UUID errors
    if (!userId || typeof userId !== 'string' || userId === 'undefined') {
      logger.warn('fetchProfile called with invalid userId:', userId);
      return;
    }

    // IN-FLIGHT GUARD: Prevent multiple simultaneous fetches for same user
    if (inFlightFetches.has(userId)) {
      logger.log('Profile fetch already in progress for user:', userId);
      return;
    }
    
    // Add to in-flight set
    setInFlightFetches(prev => new Set(prev.add(userId)));

  // ADMIN BYPASS: Check if user is in admin allowlist FIRST (before any caching or circuit breaker)
  const currentUser = user;
  const isAdminUser = currentUser?.email && ['robert@circlenetwork.io', 'andrew@heisleyteam.com', 'andrew@circlenetwork.io'].includes(currentUser.email.toLowerCase());
    
    if (isAdminUser) {
      logger.log('Admin user detected, bypassing all restrictions for:', currentUser.email);
      // Create admin profile immediately to prevent lockouts
      const adminProfile = {
        user_id: userId,
        display_name: currentUser.email.split('@')[0],
        is_admin: true,
        specialties: ['admin'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_verified: true,
        is_pro: true,
        is_creator: true
      };
      setProfile(adminProfile);
      // Cache it
      const now = Date.now();
      setProfileCache(prev => new Map(prev.set(userId, { profile: adminProfile, timestamp: now })));
      setRetryCount(0);
      setIsCircuitBreakerOpen(false); // Reset circuit breaker for admin
      // Remove from in-flight
      setInFlightFetches(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      return;
    }

    // Check cache first - 30 second cache
    const cached = profileCache.get(userId);
    const now = Date.now();
    if (cached && (now - cached.timestamp < 30000)) {
      logger.log('Using cached profile for user:', userId);
      setProfile(cached.profile);
      return;
    }

    // Circuit breaker: prevent rapid successive calls
    if (now - lastFetchAttempt < 2000) {
      logger.warn('Profile fetch called too recently, throttling...');
      return;
    }
    setLastFetchAttempt(now);

    // Circuit breaker check - but with admin recovery
    if (isCircuitBreakerOpen) {
      logger.log('Circuit breaker open, trying admin fallback for user');
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Admin fallback timeout')), 1000); // Very short timeout
        });
        
        const { data: adminData, error: adminError } = await Promise.race([
          supabase.rpc('admin_self_check_enhanced').single(),
          timeoutPromise
        ]) as any;
        
        if (!adminError && adminData?.profile_data) {
          logger.log('Admin profile fetched via admin_self_check_enhanced fallback');
          const adminProfile = {
            user_id: userId,
            display_name: adminData.profile_data.display_name || 'Admin User',
            is_admin: adminData.profile_data.is_admin || true,
            specialties: adminData.profile_data.specialties || ['admin'],
            created_at: adminData.profile_data.created_at,
            updated_at: new Date().toISOString(),
            is_verified: true,
            is_pro: true,
            is_creator: false
          };
          setProfile(adminProfile);
          setProfileCache(prev => new Map(prev.set(userId, { profile: adminProfile, timestamp: now })));
          setRetryCount(0);
          setIsCircuitBreakerOpen(false); // Reset circuit breaker on success
          return;
        }
      } catch (adminError) {
        logger.warn('Admin fallback failed:', adminError);
      }
      
      // Final admin safety net - if we're still in circuit breaker mode, don't block admins
      if (currentUser?.email) {
        const potentialAdminEmails = ['robert@circlenetwork.io', 'andrew@heisleyteam.com', 'andrew@circlenetwork.io'];
        if (potentialAdminEmails.includes(currentUser.email.toLowerCase())) {
          logger.log('Creating emergency admin profile to prevent lockout');
          const emergencyProfile = {
            user_id: userId,
            display_name: currentUser.email.split('@')[0],
            is_admin: true,
            specialties: ['admin'],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_verified: true,
            is_pro: true,
            is_creator: true
          };
          setProfile(emergencyProfile);
          setProfileCache(prev => new Map(prev.set(userId, { profile: emergencyProfile, timestamp: now })));
          return;
        }
      }
      
      logger.warn('Circuit breaker open, skipping profile fetch for non-admin user');
      return;
    }

    try {
      const startTime = performance.now();
      console.log('🔍 Starting profile fetch for userId:', userId);
      
      // Determine timeout based on route - longer for admin routes to prevent circuit breaker activation
      const isAdminRoute = window.location.pathname.includes('/admin');
      const timeoutMs = isAdminRoute ? 15000 : 8000; // Extended timeouts: 15s for admin routes, 8s elsewhere
      console.log(`⏱️ Using ${timeoutMs}ms timeout for ${isAdminRoute ? 'admin' : 'regular'} route`);
      
      // Create a timeout with proper cleanup
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Profile fetch timeout')), timeoutMs);
      });

      // Simplified query without ordering for better performance  
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
        .then(result => {
          clearTimeout(timeoutId); // Clear timeout on success
          return result;
        });

      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;
      
      const fetchDuration = performance.now() - startTime;
      console.log('📊 Profile query result:', { profileData: !!profileData, profileError, fetchDurationMs: Math.round(fetchDuration) });

      if (!profileError && profileData) {
        logger.log('Profile fetched successfully:', { 
          userId, 
          isAdmin: profileData.is_admin,
          displayName: profileData.display_name,
          fetchDurationMs: Math.round(fetchDuration)
        });
        setProfile(profileData);
        // Cache the profile
        setProfileCache(prev => new Map(prev.set(userId, { profile: profileData, timestamp: now })));
        setRetryCount(0); // Reset retry count on success
        setIsCircuitBreakerOpen(false); // Reset circuit breaker on success
        // Remove from in-flight
        setInFlightFetches(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        return;
      }

      if (profileError) {
        // Don't log timeout errors as errors since they trigger fallbacks
        const isTimeoutError = profileError.message?.includes('Profile fetch timeout');
        if (isTimeoutError) {
          logger.warn('Profile query timeout, activating fallbacks');
        } else {
          logger.warn('Profile query error:', profileError);
        }
        
        // If it's a permission error, don't retry
        if (profileError.code === 'PGRST116' || profileError.message?.includes('permission')) {
          logger.warn('Permission denied for profile access');
          setProfile(null);
          setRetryCount(0);
          return;
        }
      }

      // Fallback to RPC if direct query fails
      logger.warn('Direct profile query failed, trying RPC fallback:', profileError);
      const rpcPromise = supabase
        .rpc('get_user_profile_safe', { p_user_id: userId })
        .maybeSingle();

      const { data: rpcData, error: rpcError } = await Promise.race([
        rpcPromise,
        timeoutPromise
      ]) as any;

      if (!rpcError && rpcData) {
        logger.log('Profile fetched via RPC fallback');
        setProfile(rpcData as any);
        // Cache the profile
        setProfileCache(prev => new Map(prev.set(userId, { profile: rpcData as any, timestamp: now })));
        setRetryCount(0); // Reset retry count on success
        setIsCircuitBreakerOpen(false); // Reset circuit breaker on success
        return;
      }

      // Final admin fallback if on admin route
      if (window.location.pathname.includes('/admin')) {
        logger.warn('Regular methods failed on admin route, trying admin check fallback');
        try {
          const { data: adminData, error: adminError } = await supabase
            .rpc('admin_self_check_enhanced')
            .single();
          
          if (!adminError && adminData?.profile_data) {
            logger.log('Profile recovered via admin_self_check_enhanced');
            const adminProfile = {
              user_id: userId,
              display_name: adminData.profile_data.display_name,
              is_admin: adminData.profile_data.is_admin,
              specialties: adminData.profile_data.specialties || [],
              created_at: adminData.profile_data.created_at,
              updated_at: new Date().toISOString(),
              is_verified: false,
              is_pro: false,
              is_creator: false
            };
            setProfile(adminProfile);
            // Cache the profile
            setProfileCache(prev => new Map(prev.set(userId, { profile: adminProfile, timestamp: now })));
            setRetryCount(0);
            return;
          }
        } catch (adminError) {
          logger.warn('Admin fallback failed:', adminError);
        }
      }

      // If all else fails, check if we need to create a profile
      logger.warn('All profile fetch methods failed, user may need profile creation');
      setProfile(null);
      setRetryCount(0); // Reset retry count when giving up
      
      // Always remove from in-flight at end of function
      setInFlightFetches(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    } catch (error) {
      console.log('❌ fetchProfile exception:', error);
      
      // Check if this is a timeout error - don't retry these
      const isTimeoutError = error instanceof Error && error.message.includes('Profile fetch timeout');
      
      if (isTimeoutError) {
        console.log('⏰ Timeout error detected, not retrying to prevent infinite loop');
        logger.warn('Profile fetch timeout - activating circuit breaker and fallbacks');
        
        // FOR ADMIN USERS: Don't open circuit breaker on timeout, just set null profile
        if (isAdminUser) {
          console.log('🔑 Admin user timeout - not opening circuit breaker to prevent lockout');
          setProfile(null);
          setRetryCount(0);
          return;
        }
        
        setProfile(null);
        setRetryCount(0);
        
        // Open circuit breaker temporarily for timeout errors (non-admin users only)
        setIsCircuitBreakerOpen(true);
        setTimeout(() => {
          setIsCircuitBreakerOpen(false);
          logger.log('Circuit breaker reset after timeout');
        }, 5000); // 5 seconds for timeout errors
        return;
      }
      
      // Only retry for non-timeout errors (database connection issues, etc.)
      if (retryCount < 1) {
        console.log('🔄 Retrying profile fetch, attempt:', retryCount + 1);
        const backoffDelay = 3000;
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchProfile(userId);
        }, backoffDelay);
      } else {
        logger.warn('Max retries reached, stopping profile fetch attempts');
        setProfile(null);
        setRetryCount(0);
        
        // Open circuit breaker for other errors  
        setIsCircuitBreakerOpen(true);
        // Shorter timeout for faster recovery
        setTimeout(() => {
          setIsCircuitBreakerOpen(false);
          logger.log('Circuit breaker reset after timeout');
        }, 5000); // 5 seconds
      }
      
      // Always remove from in-flight at end of catch block
      setInFlightFetches(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  useEffect(() => {
    // Initialize cookie cleanup and monitoring on first load
    removeLegacyAuthCookies();
    initCookieMonitoring();
    
    // Clear old auth storage keys
    clearLegacyAuthKeys();
    
    // Set up auth state listener FIRST (single instance)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.log('Auth state change:', { event, hasUser: !!session?.user });
        setSession(session);
        setUser(session?.user ?? null);
        
        switch (event) {
          case 'TOKEN_REFRESHED':
          case 'USER_UPDATED':
            // nothing heavy; state above is enough
            break;
          case 'SIGNED_OUT':
            setProfile(null);
            setProvisionalProfile(null);
            queryClient.clear();
            break;
        }
        
        // Defer any Supabase calls to prevent deadlock
        if (session?.user) {
          // Create provisional profile immediately for UI responsiveness
          const provisional = createProvisionalProfile(session.user);
          setProvisionalProfile(provisional);
          
          setTimeout(async () => {
            try {
              // Ensure profile exists before fetching
              await ensureProfileExists(session.user.id);
              await fetchProfile(session.user.id);
              // Clear provisional once real profile loads
              setProvisionalProfile(null);
            } catch (error) {
              logger.error('Failed to fetch profile:', error);
              // Keep provisional profile if real fetch fails
            }
          }, 0);
        } else {
          setProfile(null);
          setProvisionalProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      logger.log('Initial session check:', { hasUser: !!session?.user });
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Create provisional profile immediately
        const provisional = createProvisionalProfile(session.user);
        setProvisionalProfile(provisional);
        
        try {
          await ensureProfileExists(session.user.id);
          await fetchProfile(session.user.id);
          // Clear provisional once real profile loads
          setProvisionalProfile(null);
        } catch (error) {
          logger.error('Failed to fetch profile on session check:', error);
          // Keep provisional profile if real fetch fails
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      logger.log('Sign out initiated...');
      
      // End session management tracking
      await sessionManagement.endSession();
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error('Sign out error:', error);
        return { error };
      }
      
      logger.log('Sign out successful, clearing state...');
      // Clear all state immediately
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Clear React Query cache
      queryClient.clear();
      
      return { error: null };
    } catch (error) {
      logger.error('Sign out exception:', error);
      return { error: error as Error };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !user.id) return { error: new Error('No user logged in') };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Refresh profile data
      await fetchProfile(user.id);
      return { error: null };
    } catch (error) {
      logger.error('Error updating profile:', error);
      return { error: error as Error };
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const value = {
    user,
    session,
    profile: profile || provisionalProfile, // Use real profile if available, otherwise provisional
    pro: getProStatus(profile || provisionalProfile),
    loading,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Session Warning Dialog */}
      <SessionWarningDialog
        warning={sessionManagement.sessionWarning}
        onDismiss={sessionManagement.dismissWarning}
        onViewSessions={() => {
          sessionManagement.dismissWarning();
          setShowSessionsDialog(true);
        }}
      />
      
      {/* Active Sessions Management Dialog */}
      <ActiveSessionsDialog
        isOpen={showSessionsDialog}
        onClose={() => setShowSessionsDialog(false)}
        sessions={sessionManagement.activeSessions}
        currentSessionId={sessionManagement.currentSessionId}
        onRevokeSessions={sessionManagement.revokeSessions}
      />
    </AuthContext.Provider>
  );
};