// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Hard allowlist for immediate admin access (bypasses all RPCs)
const ADMIN_ALLOWLIST = ['robert@circlenetwork.io'];

export const useAdminStatus = () => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['admin-status', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      // Check allowlist first - immediate admin access for critical users
      if (user.email && ADMIN_ALLOWLIST.includes(user.email.toLowerCase())) {
        return true;
      }
      
      // If we have profile data available, use it immediately for faster response
      if (profile?.is_admin === true) {
        return true;
      }
      
      // Create a shorter timeout to fail faster and prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('RPC timeout after 2 seconds')), 2000);
      });
      
      try {
        // Race between RPC call and timeout with shorter timeout
        const { data, error } = await Promise.race([
          supabase.rpc('get_user_admin_status'),
          timeoutPromise
        ]) as any;
        
        if (error) {
          throw error;
        }
        
        return !!data;
      } catch (error) {
        // Always fall back to profile data to prevent hanging
        const fallbackResult = !!profile?.is_admin;
        return fallbackResult;
      }
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // Shorter cache time
    gcTime: 5 * 60 * 1000, // Shorter garbage collection
    retry: false, // Never retry to prevent cascading timeouts
    refetchOnWindowFocus: false, // Prevent refetch on focus to avoid timeout storms
  });
};