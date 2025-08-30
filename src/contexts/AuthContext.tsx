import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { removeLegacyAuthCookies, initCookieMonitoring } from '@/lib/cookies';

import { logger } from '@/utils/logger';
import { useQueryClient } from '@tanstack/react-query';

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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => ({ error: null }),
  updateProfile: async () => ({ error: null }),
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
  const queryClient = useQueryClient();

  const fetchProfile = async (userId: string) => {
    // Guard against undefined/invalid userId - this prevents UUID errors
    if (!userId || typeof userId !== 'string' || userId === 'undefined') {
      logger.warn('fetchProfile called with invalid userId:', userId);
      return;
    }

    try {
      // Use the new safe profile function that handles duplicates
      const { data, error } = await supabase
        .rpc('get_user_profile_safe', { p_user_id: userId })
        .maybeSingle();

      if (error) {
        logger.error('Error fetching profile via RPC:', error);
        // Fallback to direct query with defensive handling
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }) // Get newest first
            .limit(1)
            .maybeSingle();
          
          if (!fallbackError && fallbackData) {
            logger.log('Profile fetched via fallback query');
            setProfile(fallbackData);
            return;
          } else if (fallbackError) {
            logger.error('Fallback profile fetch error:', fallbackError);
          }
        } catch (fallbackErr) {
          logger.error('Fallback profile fetch exception:', fallbackErr);
        }
        return;
      }

      if (data) {
        logger.log('Profile fetched successfully via RPC');
        // Cast the RPC result to match our Profile interface
        setProfile(data as any);
      } else {
        logger.warn('No profile found for user:', userId);
        setProfile(null);
      }
    } catch (error) {
      logger.error('fetchProfile exception:', error);
      setProfile(null);
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

  const value = {
    user,
    session,
    profile,
    loading,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};