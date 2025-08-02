-- Fix security definer view issue by recreating the function without SECURITY DEFINER
DROP FUNCTION IF EXISTS public.get_creator_earnings_summary(UUID);

-- Create function without SECURITY DEFINER to fix the security linter warning
CREATE OR REPLACE FUNCTION public.get_creator_earnings_summary(creator_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  result JSONB;
  total_plays INTEGER;
  total_revenue NUMERIC;
  avg_rating NUMERIC;
  content_count INTEGER;
  monthly_plays INTEGER;
  monthly_revenue NUMERIC;
BEGIN
  -- Only allow users to query their own earnings or admins to query any
  IF creator_user_id != auth.uid() AND NOT get_user_admin_status() THEN
    RAISE EXCEPTION 'Access denied: You can only view your own earnings';
  END IF;

  -- Get overall stats
  SELECT 
    COALESCE(SUM(total_plays), 0),
    COALESCE(SUM(total_revenue), 0),
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO total_plays, total_revenue, avg_rating, content_count
  FROM public.content
  WHERE creator_id = creator_user_id AND is_published = true;

  -- Get monthly stats (last 30 days)
  SELECT 
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(CASE WHEN c.price > 0 THEN c.price ELSE 0 END), 0)
  INTO monthly_plays, monthly_revenue
  FROM public.content_plays cp
  JOIN public.content c ON c.id = cp.content_id
  WHERE c.creator_id = creator_user_id 
    AND cp.played_at > now() - interval '30 days';

  -- Build result
  result := jsonb_build_object(
    'total_plays', total_plays,
    'total_revenue', total_revenue,
    'avg_rating', ROUND(avg_rating, 2),
    'content_count', content_count,
    'monthly_plays', monthly_plays,
    'monthly_revenue', monthly_revenue,
    'estimated_monthly_earnings', monthly_revenue * 0.75 -- 75% revenue share
  );

  RETURN result;
END;
$$;