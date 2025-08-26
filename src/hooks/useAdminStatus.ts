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
      
      console.log('🔐 Admin status check starting for user:', user.id);
      
      // Check allowlist first - immediate admin access for critical users
      if (user.email && ADMIN_ALLOWLIST.includes(user.email.toLowerCase())) {
        console.log('✅ User in admin allowlist - granting immediate access:', user.email);
        return true;
      }
      
      // Create a timeout promise that rejects after 7 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('RPC timeout after 7 seconds')), 7000);
      });
      
      try {
        // Race between RPC call and timeout
        const { data, error } = await Promise.race([
          supabase.rpc('get_user_admin_status'),
          timeoutPromise
        ]) as any;
        
        if (error) {
          throw error;
        }
        
        const result = !!data;
        console.log('✅ Admin status from RPC:', result);
        return result;
      } catch (error) {
        console.error('🚨 Admin RPC failed/timeout, falling back to profile.is_admin:', error);
        // Immediate fallback to profile admin status for network issues
        const fallbackResult = !!profile?.is_admin;
        console.log('🔄 Fallback admin status (Safe Mode):', fallbackResult);
        return fallbackResult;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 0, // Don't retry to avoid additional delays
  });
};