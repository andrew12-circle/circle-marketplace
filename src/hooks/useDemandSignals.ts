import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DemandSignalsData {
  totalLikes: number;
  hasLiked: boolean;
  isLoading: boolean;
}

export const useDemandSignals = (serviceId: string) => {
  const [data, setData] = useState<DemandSignalsData>({
    totalLikes: 0,
    hasLiked: false,
    isLoading: true,
  });
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch total likes and user's like status
  const fetchDemandData = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true }));

      // Get total likes count
      const { data: counterData, error: counterError } = await supabase
        .from('service_interest_counters')
        .select('total_likes')
        .eq('service_id', serviceId)
        .maybeSingle();

      if (counterError && counterError.code !== 'PGRST116') {
        console.error('Error fetching interest counter:', counterError);
      }

      const totalLikes = counterData?.total_likes || 0;

      // Check if current user has liked (only if authenticated)
      let hasLiked = false;
      if (user) {
        const { data: userInterest, error: userError } = await supabase
          .from('service_discount_interest')
          .select('id')
          .eq('service_id', serviceId)
          .eq('agent_id', user.id)
          .maybeSingle();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Error checking user interest:', userError);
        }

        hasLiked = !!userInterest;
      }

      setData({
        totalLikes,
        hasLiked,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching demand signals:', error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Like a service (show interest in discount)
  const likeService = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to show interest in discounts",
        variant: "destructive",
      });
      return false;
    }

    if (data.hasLiked) {
      toast({
        title: "Already interested",
        description: "You've already shown interest in this discount",
      });
      return false;
    }

    try {
      // Optimistic update
      setData(prev => ({
        ...prev,
        hasLiked: true,
        totalLikes: prev.totalLikes + 1,
      }));

      const { error } = await supabase
        .from('service_discount_interest')
        .insert({
          service_id: serviceId,
          agent_id: user.id,
          ip_address: null, // We could get this from request headers if needed
        });

      if (error) {
        // Rollback optimistic update
        setData(prev => ({
          ...prev,
          hasLiked: false,
          totalLikes: Math.max(0, prev.totalLikes - 1),
        }));

        if (error.code === '23505') {
          // Unique constraint violation - user already liked
          toast({
            title: "Already interested",
            description: "You've already shown interest in this discount",
          });
          // Refresh data to get correct state
          fetchDemandData();
        } else {
          toast({
            title: "Error",
            description: "Failed to register your interest. Please try again.",
            variant: "destructive",
          });
        }
        return false;
      }

      // Track the interest event (fire-and-forget) - only if user is authenticated
      if (user?.id) {
        supabase
          .from('service_tracking_events')
          .insert({
            service_id: serviceId,
            event_type: 'discount_interest',
            user_id: user.id,
            event_data: { source: 'marketplace' },
            revenue_attributed: 0,
          })
          .then(({ error: trackingError }) => {
            if (trackingError) {
              console.warn('Failed to track discount interest event:', trackingError);
            }
          });
      }

      toast({
        title: "Interest registered!",
        description: "We'll notify the vendor about the demand for discounts.",
      });

      return true;
    } catch (error) {
      // Rollback optimistic update
      setData(prev => ({
        ...prev,
        hasLiked: false,
        totalLikes: Math.max(0, prev.totalLikes - 1),
      }));

      console.error('Error liking service:', error);
      toast({
        title: "Error",
        description: "Failed to register your interest. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (serviceId) {
      fetchDemandData();
    }
  }, [serviceId, user?.id]);

  return {
    ...data,
    likeService,
    refreshData: fetchDemandData,
  };
};