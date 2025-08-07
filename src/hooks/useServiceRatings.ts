import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ServiceRatingStats {
  averageRating: number;
  totalReviews: number;
}

export const useServiceRatings = (serviceId: string) => {
  const [stats, setStats] = useState<ServiceRatingStats>({ averageRating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!serviceId) return;

    const fetchServiceRatings = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .rpc('get_service_rating_stats', { service_id: serviceId });

        if (error) {
          console.error('Error fetching service ratings:', error);
          toast({
            title: "Error loading ratings",
            description: "Failed to load service ratings",
            variant: "destructive",
          });
          return;
        }

        if (data && data.length > 0) {
          setStats({
            averageRating: Number(data[0].average_rating) || 0,
            totalReviews: Number(data[0].total_reviews) || 0
          });
        }
      } catch (error) {
        console.error('Error fetching service ratings:', error);
        toast({
          title: "Error loading ratings",
          description: "Failed to load service ratings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchServiceRatings();
  }, [serviceId, toast]);

  return { ...stats, loading };
};