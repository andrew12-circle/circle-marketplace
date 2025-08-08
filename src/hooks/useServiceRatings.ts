
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ServiceRatingStats {
  averageRating: number;
  totalReviews: number;
}

type Resolver = (value: ServiceRatingStats) => void;
type Rejector = (reason?: any) => void;

interface PendingRequest {
  serviceId: string;
  resolve: Resolver;
  reject: Rejector;
}

// Simple in-memory batching queue to combine multiple service rating loads
let pendingQueue: PendingRequest[] = [];
let batchTimer: number | null = null;

// Cache results in-memory for session (avoid re-hitting RPC repeatedly)
const ratingCache = new Map<string, ServiceRatingStats>();

const flushBatch = async () => {
  const batch = pendingQueue;
  pendingQueue = [];
  batchTimer = null;

  // De-duplicate service IDs
  const ids = Array.from(new Set(batch.map((r) => r.serviceId)));

  try {
    // Use new bulk RPC for ratings
    const { data, error } = await supabase.rpc("get_service_ratings_bulk", {
      p_service_ids: ids,
    });

    if (error) throw error;

    const map = new Map<string, ServiceRatingStats>();
    (data || []).forEach((row: any) => {
      map.set(String(row.service_id), {
        averageRating: Number(row.average_rating || 0),
        totalReviews: Number(row.total_reviews || 0),
      });
    });

    // Resolve each queued request
    batch.forEach(({ serviceId, resolve }) => {
      const stats =
        map.get(serviceId) ||
        ratingCache.get(serviceId) || {
          averageRating: 0,
          totalReviews: 0,
        };
      // Update cache
      ratingCache.set(serviceId, stats);
      resolve(stats);
    });
  } catch (e) {
    // Reject each queued request
    batch.forEach(({ reject }) => reject(e));
  }
};

const enqueue = (serviceId: string) => {
  return new Promise<ServiceRatingStats>((resolve, reject) => {
    pendingQueue.push({ serviceId, resolve, reject });

    // Start/Restart a short timer to batch requests closely together
    if (batchTimer) {
      window.clearTimeout(batchTimer);
    }
    batchTimer = window.setTimeout(flushBatch, 40); // batch within 40ms window
  });
};

export const useServiceRatings = (serviceId: string) => {
  const [stats, setStats] = useState<ServiceRatingStats>({
    averageRating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!serviceId) return;

    // If in cache, serve instantly
    if (ratingCache.has(serviceId)) {
      setStats(ratingCache.get(serviceId)!);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    enqueue(serviceId)
      .then((result) => {
        if (cancelled) return;
        setStats(result);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Error fetching service ratings (batched):", error);
        toast({
          title: "Error loading ratings",
          description: "Failed to load service ratings",
          variant: "destructive",
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [serviceId, toast]);

  return { ...stats, loading };
};
