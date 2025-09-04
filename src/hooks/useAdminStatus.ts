// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/utils/logger";

export const useAdminStatus = () => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['admin-status', user?.id, profile?.is_admin],
    queryFn: async () => {
      if (!user) return false;
      
      // Client-side admin allowlist for known admins
      if (user.email === 'andrew@circlenetwork.io') {
        logger.log('Admin status: Allowed via client allowlist', { email: user.email });
        return true;
      }
      
      // Prioritize profile data - if we have it and it's true, use it immediately
      if (profile?.is_admin === true) {
        logger.log('Admin status: Confirmed via profile', { userId: user.id, isAdmin: true });
        return true;
      }
      
      // If profile explicitly says false, check server to be sure
      if (profile?.is_admin === false) {
        logger.log('Admin status: Profile indicates non-admin, checking server...', { userId: user.id });
        
        try {
          const { data: serverCheck, error } = await supabase.rpc('get_user_admin_status');
          if (error) {
            logger.warn('Admin status: Server check failed, using profile data', { error });
            return false;
          }
          return !!serverCheck;
        } catch (error) {
          logger.warn('Admin status: Server check exception, using profile data', { error });
          return false;
        }
      }
      
      // No profile data, check server
      try {
        const { data: serverCheck, error } = await supabase.rpc('get_user_admin_status');
        if (error) {
          logger.warn('Admin status: Server check failed', { error });
          return false;
        }
        const result = !!serverCheck;
        logger.log('Admin status: Server result', { userId: user.id, isAdmin: result });
        return result;
      } catch (error) {
        logger.warn('Admin status: Server check exception', { error });
        return false;
      }
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