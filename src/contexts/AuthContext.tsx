// @ts-nocheck
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { removeLegacyAuthCookies, initCookieMonitoring } from '@/lib/cookies';

import { logger } from '@/utils/logger';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';

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
  loading: boolean;
  signOut: () => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
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
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const queryClient = useQueryClient();
  const { handleSessionError, triggerRecoveryBanner } = useSessionPersistence();

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

    try {
      // Try direct query first with timeout for better reliability
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
      });

      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      if (!profileError && profileData) {
        logger.log('Profile fetched via direct query:', { 
          userId, 
          isAdmin: profileData.is_admin,
          displayName: profileData.display_name 
        });
        setProfile(profileData);
        return;
      }

      // Fallback to RPC if direct query fails
      logger.warn('Direct profile query failed, trying RPC fallback:', profileError);
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_user_profile_safe', { p_user_id: userId })
        .maybeSingle();

      if (!rpcError && rpcData) {
        logger.log('Profile fetched via RPC fallback');
        setProfile(rpcData as any);
        return;
      }

      // If all else fails, check if we need to create a profile
      logger.warn('All profile fetch methods failed, user may need profile creation');
      setProfile(null);
    } catch (error) {
      logger.error('fetchProfile exception:', error);
      
      // Retry logic for stuck states
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchProfile(userId);
        }, 1000 * (retryCount + 1));
      } else {
        setProfile(null);
      }
    }
  };

  useEffect(() => {
    // Initialize cookie cleanup and monitoring on first load
    removeLegacyAuthCookies();
    initCookieMonitoring();
    
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
            queryClient.clear();
            break;
        }
        
        // Defer any Supabase calls to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
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
        await fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      logger.log('Sign out initiated...');
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
    profile,
    loading,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};