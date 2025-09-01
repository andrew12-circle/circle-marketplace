// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/utils/logger";

// Hard allowlist for immediate admin access (bypasses all RPCs)
const ADMIN_ALLOWLIST = ['robert@circlenetwork.io'];

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
      
      // Only try RPC if profile data is unavailable or null
      if (profile?.is_admin === null || profile?.is_admin === undefined) {
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('RPC timeout')), 3000);
          });
          
          const { data, error } = await Promise.race([
            supabase.rpc('get_user_admin_status'),
            timeoutPromise
          ]) as any;
          
          if (!error && data !== null) {
            logger.log('Admin status: Retrieved via RPC', { userId: user.id, isAdmin: !!data });
            return !!data;
          }
        } catch (error) {
          logger.warn('Admin status RPC failed, using profile fallback:', error);
        }
      }
      
      // Final fallback to profile data
      const result = !!profile?.is_admin;
      logger.log('Admin status: Final result', { userId: user.id, isAdmin: result, source: 'profile_fallback' });
      return result;
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds - shorter for quicker updates
    gcTime: 2 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    // Make it reactive to profile changes
    refetchOnMount: 'always',
  });
};