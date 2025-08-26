import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAdminStatus = () => {
  const { user, profile } = useAuth();

  return useQuery({
    queryKey: ['admin-status', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      console.log('🔐 Admin status check starting for user:', user.id);
      
      const { data, error } = await supabase.rpc('get_user_admin_status');
      if (error) {
        console.error('🚨 Admin RPC failed, falling back to profile.is_admin:', error);
        // Graceful fallback to profile admin status
        const fallbackResult = !!profile?.is_admin;
        console.log('🔄 Fallback admin status:', fallbackResult);
        return fallbackResult;
      }
      
      const result = !!data;
      console.log('✅ Admin status from RPC:', result);
      return result;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};