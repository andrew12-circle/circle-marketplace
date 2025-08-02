-- Find and fix any SECURITY DEFINER views
-- Drop the problematic view if it exists
DROP VIEW IF EXISTS vendor_service_analytics;

-- Recreate without SECURITY DEFINER
CREATE VIEW vendor_service_analytics AS
SELECT DISTINCT
  s.vendor_id,
  COUNT(s.id) as total_services,
  COALESCE(SUM(sv.view_count), 0) as total_views,
  COALESCE(SUM(cb.booking_count), 0) as total_bookings,
  CASE 
    WHEN SUM(sv.view_count) > 0 
    THEN ROUND((SUM(cb.booking_count)::numeric / SUM(sv.view_count)::numeric) * 100, 2)
    ELSE 0 
  END as conversion_rate,
  COALESCE(AVG(s.rating), 0) as avg_rating,
  COALESCE(SUM(sr.review_count), 0) as total_reviews
FROM services s
LEFT JOIN (
  SELECT service_id, COUNT(*) as view_count
  FROM service_views 
  GROUP BY service_id
) sv ON s.id = sv.service_id
LEFT JOIN (
  SELECT service_id, COUNT(*) as booking_count
  FROM consultation_bookings 
  GROUP BY service_id
) cb ON s.id = cb.service_id
LEFT JOIN (
  SELECT service_id, COUNT(*) as review_count
  FROM service_reviews 
  GROUP BY service_id
) sr ON s.id = sr.service_id
GROUP BY s.vendor_id;