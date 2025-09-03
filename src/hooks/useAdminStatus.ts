// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/utils/logger";

// Hard allowlist for immediate admin access (bypasses all RPCs)
const ADMIN_ALLOWLIST = ['robert@circlenetwork.io', 'andrew@heisleyteam.com'];

export const useAdminStatus = () => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['admin-status', user?.id, profile?.is_admin],
    queryFn: async () => {
      if (!user) return false;
      
      // Check allowlist first - immediate admin access for critical users
      if (user.email && ADMIN_ALLOWLIST.includes(user.email.toLowerCase())) {
        logger.log('Admin status: User in allowlist', { email: user.email });
        return true;
      }
      
      // Prioritize profile data - if we have it and it's true, use it immediately
      if (profile?.is_admin === true) {
        logger.log('Admin status: Confirmed via profile', { userId: user.id, isAdmin: true });
        return true;
      }
      
      // If profile explicitly says false, don't bother with RPC
      if (profile?.is_admin === false) {
        logger.log('Admin status: Profile indicates non-admin', { userId: user.id });
        return false;
      }
      
      // Skip RPC altogether - rely on server-side function which has allowlist built-in
      // The server function get_user_admin_status() now handles allowlist internally
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('RPC timeout')), 2000); // Shorter timeout 
        });
        
        const { data, error } = await Promise.race([
          supabase.rpc('get_user_admin_status'),
          timeoutPromise
        ]) as any;
        
        if (!error && data !== null) {
          logger.log('Admin status: Retrieved via RPC with server allowlist', { userId: user.id, isAdmin: !!data });
          return !!data;
        }
      } catch (error) {
        // Don't log warnings for expected timeout scenarios
        if (!error?.message?.includes('timeout')) {
          logger.warn('Admin status RPC failed, using profile fallback:', error);
        }
      }
      
      // Final fallback to profile data
      const result = !!profile?.is_admin;
      logger.log('Admin status: Final result', { userId: user.id, isAdmin: result, source: 'profile_fallback' });
      return result;
    },
    enabled: !!user,
    staleTime: 60 * 1000, // 1 minute - admin status doesn't change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Single retry on failure
    retryDelay: 500,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on every mount
    refetchInterval: false, // Don't auto-refetch
    networkMode: 'online', // Only run when online
  });
};