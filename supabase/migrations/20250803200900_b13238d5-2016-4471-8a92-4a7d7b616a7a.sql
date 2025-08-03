-- Fix the security definer view by finding and updating it
-- First, let's find views with SECURITY DEFINER
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND (definition ILIKE '%security definer%' OR definition NOT ILIKE '%security_invoker%');

-- Update the vendor_service_analytics view to use SECURITY INVOKER
DROP VIEW IF EXISTS public.vendor_service_analytics;

CREATE VIEW public.vendor_service_analytics 
WITH (security_invoker=on)
AS 
SELECT 
  v.id as vendor_id,
  COUNT(s.id) as total_services,
  COALESCE(SUM(s.views_count), 0) as total_views,
  COALESCE(SUM(s.bookings_count), 0) as total_bookings,
  CASE 
    WHEN SUM(s.views_count) > 0 
    THEN (COALESCE(SUM(s.bookings_count), 0)::numeric / SUM(s.views_count)::numeric) * 100 
    ELSE 0 
  END as conversion_rate,
  COALESCE(AVG(s.rating), 0) as avg_rating,
  COALESCE(SUM(s.reviews_count), 0) as total_reviews
FROM public.vendors v
LEFT JOIN public.services s ON v.id = s.vendor_id
GROUP BY v.id;