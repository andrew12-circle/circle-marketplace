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
      
      // Client-side admin allowlist - immediate return
      if (user.email === 'andrew@circlenetwork.io' || user.email === 'andrew@heisleyteam.com') {
        logger.log('Admin status: Allowed via client allowlist', { email: user.email });
        return true;
      }
      
      // If profile confirms admin status, return immediately
      if (profile?.is_admin === true) {
        logger.log('Admin status: Confirmed via profile', { userId: user.id, isAdmin: true });
        return true;
      }
      
      // Only check server if profile is explicitly false or missing
      if (profile?.is_admin === false) {
        logger.log('Admin status: Profile indicates non-admin', { userId: user.id });
        return false;
      }
      
      // No profile data - check server once
      logger.log('Admin status: No profile data, checking server...', { userId: user.id });
      try {
        const { data: serverCheck, error } = await supabase.rpc('get_user_admin_status');
        
        if (error) {
          logger.warn('Admin status: Server check failed', { error });
          return false;
        }
        const result = !!serverCheck;
        logger.log('Admin status: Server result', { userId: user.id, isAdmin: result });
        return result;
      } catch (error: any) {
        logger.warn('Admin status: Server check exception', { error });
        return false;
      }
    },
    enabled: !!user,
    staleTime: 15 * 60 * 1000, // 15 minutes - admin status rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
    retryDelay: 500,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    networkMode: 'online',
  });
};