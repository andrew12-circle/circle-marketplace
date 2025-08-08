
-- 1) Helpful indexes for high-traffic queries

-- Services ordering (used in fetchServices)
CREATE INDEX IF NOT EXISTS idx_services_sort_order ON public.services (sort_order);
CREATE INDEX IF NOT EXISTS idx_services_created_at ON public.services (created_at);

-- Vendors ordering (used in fetchVendors)
CREATE INDEX IF NOT EXISTS idx_vendors_sort_order ON public.vendors (sort_order);
CREATE INDEX IF NOT EXISTS idx_vendors_rating ON public.vendors (rating);

-- Disclaimers fallback query (is_active + latest)
CREATE INDEX IF NOT EXISTS idx_respa_disclaimers_active_created ON public.respa_disclaimers (is_active, created_at DESC);

-- Saved services by user
CREATE INDEX IF NOT EXISTS idx_saved_services_user ON public.saved_services (user_id);

-- Service reviews aggregation by service
CREATE INDEX IF NOT EXISTS idx_service_reviews_service_id ON public.service_reviews (service_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_service_created ON public.service_reviews (service_id, created_at);

-- 2) Bulk ratings RPC to replace N-per-card calls
CREATE OR REPLACE FUNCTION public.get_service_ratings_bulk(p_service_ids uuid[])
RETURNS TABLE (
  service_id uuid,
  average_rating numeric,
  total_reviews integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    sr.service_id,
    COALESCE(ROUND(AVG(sr.rating)::numeric, 2), 0) AS average_rating,
    COUNT(*)::integer AS total_reviews
  FROM public.service_reviews sr
  WHERE sr.service_id = ANY(p_service_ids)
  GROUP BY sr.service_id;
END;
$function$;
