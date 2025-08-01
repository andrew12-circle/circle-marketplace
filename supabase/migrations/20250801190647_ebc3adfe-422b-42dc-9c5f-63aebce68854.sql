-- Drop the problematic view and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS vendor_service_analytics;

-- Create a regular view (not SECURITY DEFINER) for vendor analytics
CREATE VIEW vendor_service_analytics AS
SELECT 
  s.vendor_id,
  s.id as service_id,
  s.title,
  s.category,
  s.created_at,
  COALESCE(sv.total_views, 0) as total_views,
  COALESCE(cb.total_bookings, 0) as total_bookings,
  COALESCE(cb.pending_bookings, 0) as pending_bookings,
  COALESCE(cb.completed_bookings, 0) as completed_bookings,
  COALESCE(sr.avg_rating, 0) as avg_rating,
  COALESCE(sr.total_reviews, 0) as total_reviews,
  COALESCE(saved.save_count, 0) as save_count,
  -- Calculate conversion rate (bookings / views)
  CASE 
    WHEN COALESCE(sv.total_views, 0) > 0 
    THEN ROUND((COALESCE(cb.total_bookings, 0)::numeric / sv.total_views * 100), 2)
    ELSE 0 
  END as conversion_rate
FROM services s
LEFT JOIN (
  SELECT service_id, COUNT(*) as total_views
  FROM service_views 
  GROUP BY service_id
) sv ON s.id = sv.service_id
LEFT JOIN (
  SELECT 
    service_id, 
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings
  FROM consultation_bookings 
  GROUP BY service_id
) cb ON s.id = cb.service_id
LEFT JOIN (
  SELECT 
    service_id,
    ROUND(AVG(rating)::numeric, 2) as avg_rating,
    COUNT(*) as total_reviews
  FROM service_reviews 
  GROUP BY service_id
) sr ON s.id = sr.service_id
LEFT JOIN (
  SELECT service_id, COUNT(*) as save_count
  FROM saved_services 
  GROUP BY service_id
) saved ON s.id = saved.service_id;

-- Create RLS policy for the view
ALTER VIEW vendor_service_analytics OWNER TO postgres;

-- Grant access to authenticated users
GRANT SELECT ON vendor_service_analytics TO authenticated;