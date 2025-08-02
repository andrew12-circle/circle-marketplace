-- Fix security warnings by setting proper search paths
CREATE OR REPLACE FUNCTION update_creator_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month TEXT;
  creator_record RECORD;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');
  
  -- Update analytics for each creator
  FOR creator_record IN 
    SELECT DISTINCT creator_id FROM public.content WHERE creator_id IS NOT NULL
  LOOP
    INSERT INTO public.creator_analytics (
      creator_id,
      month_year,
      total_plays,
      total_watch_time_minutes,
      total_downloads,
      unique_viewers,
      revenue_generated,
      creator_earnings
    )
    SELECT 
      creator_record.creator_id,
      current_month,
      COALESCE(SUM(CASE WHEN cee.event_type = 'play' THEN 1 ELSE 0 END), 0),
      COALESCE(SUM(cee.watch_time_seconds) / 60, 0),
      COALESCE(SUM(CASE WHEN cee.event_type = 'download' THEN 1 ELSE 0 END), 0),
      COALESCE(COUNT(DISTINCT cee.user_id), 0),
      COALESCE(SUM(cee.revenue_attributed), 0),
      COALESCE(SUM(cee.revenue_attributed) * 0.25, 0) -- 25% creator share
    FROM public.content c
    LEFT JOIN public.content_engagement_events cee ON c.id = cee.content_id
    WHERE c.creator_id = creator_record.creator_id
      AND cee.created_at >= date_trunc('month', now())
      AND cee.created_at < date_trunc('month', now()) + interval '1 month'
    GROUP BY creator_record.creator_id
    
    ON CONFLICT (creator_id, month_year) DO UPDATE SET
      total_plays = EXCLUDED.total_plays,
      total_watch_time_minutes = EXCLUDED.total_watch_time_minutes,
      total_downloads = EXCLUDED.total_downloads,
      unique_viewers = EXCLUDED.unique_viewers,
      revenue_generated = EXCLUDED.revenue_generated,
      creator_earnings = EXCLUDED.creator_earnings,
      updated_at = now();
  END LOOP;
END;
$$;

-- Fix security warnings by setting proper search paths
CREATE OR REPLACE FUNCTION calculate_monthly_payouts(target_month TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calc_month TEXT;
  creator_record RECORD;
  platform_revenue NUMERIC;
BEGIN
  calc_month := COALESCE(target_month, to_char(now() - interval '1 month', 'YYYY-MM'));
  
  -- Get total platform revenue for the month
  SELECT COALESCE(total_platform_revenue, 0) INTO platform_revenue
  FROM public.monthly_platform_revenue
  WHERE month_year = calc_month;
  
  -- Calculate payouts for each creator
  FOR creator_record IN 
    SELECT creator_id, SUM(creator_earnings) as total_earnings
    FROM public.creator_analytics
    WHERE month_year = calc_month
    GROUP BY creator_id
    HAVING SUM(creator_earnings) > 0
  LOOP
    INSERT INTO public.creator_payouts (
      creator_id,
      payout_month,
      total_earnings,
      net_payout,
      final_amount,
      payment_method,
      status
    )
    SELECT 
      creator_record.creator_id,
      calc_month,
      creator_record.total_earnings,
      creator_record.total_earnings, -- No platform fee for now
      creator_record.total_earnings,
      COALESCE(cpi.payment_method, 'pending'),
      CASE 
        WHEN cpi.verified = true THEN 'pending'
        ELSE 'requires_setup'
      END
    FROM public.creator_payment_info cpi
    WHERE cpi.creator_id = creator_record.creator_id
    
    ON CONFLICT (creator_id, payout_month) DO UPDATE SET
      total_earnings = EXCLUDED.total_earnings,
      net_payout = EXCLUDED.net_payout,
      final_amount = EXCLUDED.final_amount,
      updated_at = now();
  END LOOP;
END;
$$;