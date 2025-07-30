-- Fix remaining security linter issues

-- Fix Function Search Path Mutable warnings by updating remaining functions
CREATE OR REPLACE FUNCTION public.update_content_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.content 
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM public.content_ratings 
    WHERE content_id = COALESCE(NEW.content_id, OLD.content_id)
  )
  WHERE id = COALESCE(NEW.content_id, OLD.content_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_content_plays(content_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.content 
  SET total_plays = total_plays + 1 
  WHERE id = content_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_video_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.videos 
  SET rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM public.video_ratings 
    WHERE video_id = COALESCE(NEW.video_id, OLD.video_id)
  )
  WHERE id = COALESCE(NEW.video_id, OLD.video_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_video_views(video_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.videos 
  SET view_count = view_count + 1 
  WHERE id = video_uuid;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_monthly_revenue(target_month text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  total_subscription_revenue NUMERIC := 47.00; -- Monthly subscription amount
  creator_percentage NUMERIC := 0.25; -- 25% goes to creators
  total_creator_plays INTEGER;
  creator_record RECORD;
BEGIN
  -- Get total plays for the month across all creators
  SELECT COALESCE(SUM(total_plays), 0) INTO total_creator_plays
  FROM public.content 
  WHERE DATE_TRUNC('month', created_at) = target_month::date;
  
  -- If no plays, exit
  IF total_creator_plays = 0 THEN
    RETURN;
  END IF;
  
  -- Calculate revenue for each creator
  FOR creator_record IN 
    SELECT 
      p.user_id as creator_id,
      COALESCE(SUM(c.total_plays), 0) as creator_plays
    FROM public.profiles p
    LEFT JOIN public.content c ON p.user_id = c.creator_id 
    WHERE p.is_creator = true
    AND (c.created_at IS NULL OR DATE_TRUNC('month', c.created_at) = target_month::date)
    GROUP BY p.user_id
  LOOP
    -- Insert or update revenue tracking
    INSERT INTO public.revenue_tracking (
      creator_id, 
      month_year, 
      total_plays, 
      revenue_earned,
      revenue_share_percentage
    ) VALUES (
      creator_record.creator_id,
      target_month,
      creator_record.creator_plays,
      (creator_record.creator_plays::NUMERIC / total_creator_plays) * total_subscription_revenue * creator_percentage,
      25.00
    )
    ON CONFLICT (creator_id, month_year) 
    DO UPDATE SET
      total_plays = EXCLUDED.total_plays,
      revenue_earned = EXCLUDED.revenue_earned;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_trending_import()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://ihzyuyfawapweamqzzlj.supabase.co/functions/v1/auto-import-trending',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imloenl1eWZhd2Fwd2VhbXF6emxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NTA4MTcsImV4cCI6MjA2OTMyNjgxN30.0JJSfqwd1lwI0QB5vcex_xqO-YoTfcaU95HtX9nyl_s"}'::jsonb,
    body := '{"manual_trigger": true}'::jsonb
  );
END;
$function$;