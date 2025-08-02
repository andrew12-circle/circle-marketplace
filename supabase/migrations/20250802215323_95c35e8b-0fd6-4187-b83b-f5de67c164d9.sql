-- Add content type weightings and weighted engagement tracking

-- Create content type weightings table
CREATE TABLE public.content_type_weightings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type text NOT NULL UNIQUE,
  base_weight_percentage NUMERIC NOT NULL DEFAULT 0,
  engagement_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default weightings
INSERT INTO public.content_type_weightings (content_type, base_weight_percentage, engagement_multiplier) VALUES
('video_short', 10.0, 1.0),
('video', 25.0, 1.0),
('podcast', 20.0, 1.0),
('course', 25.0, 1.2),
('book', 20.0, 1.1);

-- Add weighted engagement columns to content_engagement_events
ALTER TABLE public.content_engagement_events 
ADD COLUMN IF NOT EXISTS weighted_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_weight_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_quality_score NUMERIC DEFAULT 1.0;

-- Add weighted analytics columns to creator_analytics
ALTER TABLE public.creator_analytics
ADD COLUMN IF NOT EXISTS weighted_engagement_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS content_type_breakdown JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS quality_adjusted_earnings NUMERIC DEFAULT 0;

-- Create function to calculate content engagement quality score
CREATE OR REPLACE FUNCTION public.calculate_engagement_quality_score(
  p_content_type text,
  p_completion_percentage numeric,
  p_watch_time_seconds integer,
  p_total_content_duration integer DEFAULT NULL
) RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  quality_score NUMERIC := 1.0;
  content_weighting RECORD;
BEGIN
  -- Get content type weighting
  SELECT * INTO content_weighting
  FROM public.content_type_weightings
  WHERE content_type = p_content_type;
  
  IF content_weighting.id IS NULL THEN
    -- Default weighting if not found
    content_weighting.base_weight_percentage := 15.0;
    content_weighting.engagement_multiplier := 1.0;
  END IF;
  
  -- Calculate quality score based on content type and engagement
  CASE p_content_type
    WHEN 'video_short' THEN
      -- For shorts, completion percentage is most important
      quality_score := GREATEST(0.1, LEAST(1.0, p_completion_percentage / 100.0));
      
    WHEN 'video' THEN
      -- For full videos, balance completion and watch time
      quality_score := GREATEST(0.2, 
        (p_completion_percentage / 100.0 * 0.7) + 
        (LEAST(1.0, p_watch_time_seconds::numeric / GREATEST(1, p_total_content_duration::numeric)) * 0.3)
      );
      
    WHEN 'podcast' THEN
      -- For podcasts, focus heavily on completion
      quality_score := GREATEST(0.15, p_completion_percentage / 100.0);
      
    WHEN 'course' THEN
      -- For courses, completion is critical
      quality_score := GREATEST(0.1, (p_completion_percentage / 100.0) * 1.2);
      
    WHEN 'book' THEN
      -- For books, any meaningful reading counts
      quality_score := GREATEST(0.25, p_completion_percentage / 100.0);
      
    ELSE
      -- Default calculation
      quality_score := GREATEST(0.2, p_completion_percentage / 100.0);
  END CASE;
  
  -- Apply engagement multiplier
  quality_score := quality_score * content_weighting.engagement_multiplier;
  
  RETURN LEAST(2.0, quality_score); -- Cap at 2x for exceptional engagement
END;
$$;

-- Create function to calculate weighted engagement score
CREATE OR REPLACE FUNCTION public.calculate_weighted_engagement_score(
  p_content_type text,
  p_engagement_quality_score numeric,
  p_revenue_attributed numeric DEFAULT 0
) RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  content_weighting RECORD;
  weighted_score NUMERIC := 0;
BEGIN
  -- Get content type weighting
  SELECT * INTO content_weighting
  FROM public.content_type_weightings
  WHERE content_type = p_content_type;
  
  IF content_weighting.id IS NULL THEN
    content_weighting.base_weight_percentage := 15.0;
  END IF;
  
  -- Calculate weighted score
  weighted_score := (content_weighting.base_weight_percentage / 100.0) * 
                   p_engagement_quality_score * 
                   (1 + p_revenue_attributed);
  
  RETURN weighted_score;
END;
$$;

-- Create trigger to automatically calculate weighted scores on engagement events
CREATE OR REPLACE FUNCTION public.update_engagement_weighted_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  content_record RECORD;
  content_duration INTEGER := 0;
BEGIN
  -- Get content information
  SELECT content_type, duration INTO content_record
  FROM public.content
  WHERE id = NEW.content_id;
  
  -- Parse duration if it's a string (e.g., "1:30:45" or "90 minutes")
  IF content_record.duration IS NOT NULL THEN
    -- Simple parsing - assumes format like "1:30:45" or just minutes
    content_duration := CASE 
      WHEN content_record.duration ~ '^[0-9]+:[0-9]+:[0-9]+$' THEN
        -- Format: HH:MM:SS
        EXTRACT(EPOCH FROM content_record.duration::interval)::integer
      WHEN content_record.duration ~ '^[0-9]+:[0-9]+$' THEN
        -- Format: MM:SS
        EXTRACT(EPOCH FROM ('00:' || content_record.duration)::interval)::integer
      WHEN content_record.duration ~ '^[0-9]+ minutes?$' THEN
        -- Format: "90 minutes"
        (regexp_replace(content_record.duration, '[^0-9]', '', 'g')::integer * 60)
      ELSE
        COALESCE(NEW.watch_time_seconds, 300) -- Default 5 minutes
    END;
  ELSE
    content_duration := COALESCE(NEW.watch_time_seconds, 300);
  END IF;
  
  -- Calculate engagement quality score
  NEW.engagement_quality_score := public.calculate_engagement_quality_score(
    content_record.content_type::text,
    COALESCE(NEW.completion_percentage, 0),
    COALESCE(NEW.watch_time_seconds, 0),
    content_duration
  );
  
  -- Get content weight percentage
  SELECT base_weight_percentage INTO NEW.content_weight_percentage
  FROM public.content_type_weightings
  WHERE content_type = content_record.content_type::text;
  
  NEW.content_weight_percentage := COALESCE(NEW.content_weight_percentage, 15.0);
  
  -- Calculate weighted score
  NEW.weighted_score := public.calculate_weighted_engagement_score(
    content_record.content_type::text,
    NEW.engagement_quality_score,
    COALESCE(NEW.revenue_attributed, 0)
  );
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER update_engagement_weighted_scores_trigger
  BEFORE INSERT OR UPDATE ON public.content_engagement_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_engagement_weighted_scores();

-- Update existing records with weighted scores (this might take a moment)
UPDATE public.content_engagement_events 
SET engagement_quality_score = 1.0, 
    content_weight_percentage = 15.0,
    weighted_score = 15.0
WHERE weighted_score IS NULL OR weighted_score = 0;

-- Enable RLS on content_type_weightings
ALTER TABLE public.content_type_weightings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for content_type_weightings
CREATE POLICY "Content weightings are viewable by everyone" 
ON public.content_type_weightings 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage content weightings" 
ON public.content_type_weightings 
FOR ALL 
USING (get_user_admin_status());

-- Update creator analytics calculation function to use weighted scores
CREATE OR REPLACE FUNCTION public.update_creator_analytics_weighted()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_month TEXT;
  creator_record RECORD;
  total_platform_revenue NUMERIC;
  creator_share_amount NUMERIC;
  total_weighted_score NUMERIC;
  creator_weighted_score NUMERIC;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');
  
  -- Get total platform revenue for current month
  SELECT COALESCE(total_platform_revenue, 47 * 1000) INTO total_platform_revenue -- Default estimate
  FROM public.monthly_platform_revenue
  WHERE month_year = current_month;
  
  -- Calculate 25% creator share
  creator_share_amount := total_platform_revenue * 0.25;
  
  -- Calculate total weighted engagement score across all creators
  SELECT COALESCE(SUM(cee.weighted_score), 1) INTO total_weighted_score
  FROM public.content_engagement_events cee
  WHERE cee.created_at >= date_trunc('month', now())
    AND cee.created_at < date_trunc('month', now()) + interval '1 month';
  
  -- Update analytics for each creator
  FOR creator_record IN 
    SELECT DISTINCT creator_id FROM public.content WHERE creator_id IS NOT NULL
  LOOP
    -- Calculate creator's weighted score
    SELECT COALESCE(SUM(cee.weighted_score), 0) INTO creator_weighted_score
    FROM public.content c
    JOIN public.content_engagement_events cee ON c.id = cee.content_id
    WHERE c.creator_id = creator_record.creator_id
      AND cee.created_at >= date_trunc('month', now())
      AND cee.created_at < date_trunc('month', now()) + interval '1 month';
    
    INSERT INTO public.creator_analytics (
      creator_id,
      month_year,
      total_plays,
      total_watch_time_minutes,
      total_downloads,
      unique_viewers,
      revenue_generated,
      creator_earnings,
      weighted_engagement_score,
      quality_adjusted_earnings,
      content_type_breakdown
    )
    SELECT 
      creator_record.creator_id,
      current_month,
      COALESCE(COUNT(CASE WHEN cee.event_type = 'play' THEN 1 END), 0),
      COALESCE(SUM(cee.watch_time_seconds) / 60, 0),
      COALESCE(COUNT(CASE WHEN cee.event_type = 'download' THEN 1 END), 0),
      COALESCE(COUNT(DISTINCT cee.user_id), 0),
      COALESCE(SUM(cee.revenue_attributed), 0),
      -- Quality-adjusted earnings based on weighted score
      CASE 
        WHEN total_weighted_score > 0 THEN 
          (creator_weighted_score / total_weighted_score) * creator_share_amount
        ELSE 0 
      END,
      creator_weighted_score,
      -- Quality-adjusted earnings
      CASE 
        WHEN total_weighted_score > 0 THEN 
          (creator_weighted_score / total_weighted_score) * creator_share_amount
        ELSE 0 
      END,
      -- Content type breakdown
      (
        SELECT jsonb_object_agg(
          content_type, 
          jsonb_build_object(
            'weighted_score', COALESCE(SUM(cee_inner.weighted_score), 0),
            'plays', COUNT(CASE WHEN cee_inner.event_type = 'play' THEN 1 END),
            'avg_completion', COALESCE(AVG(cee_inner.completion_percentage), 0)
          )
        )
        FROM public.content c_inner
        JOIN public.content_engagement_events cee_inner ON c_inner.id = cee_inner.content_id
        WHERE c_inner.creator_id = creator_record.creator_id
          AND cee_inner.created_at >= date_trunc('month', now())
          AND cee_inner.created_at < date_trunc('month', now()) + interval '1 month'
        GROUP BY c_inner.content_type
      )
    FROM public.content c
    LEFT JOIN public.content_engagement_events cee ON c.id = cee.content_id
    WHERE c.creator_id = creator_record.creator_id
      AND (cee.created_at IS NULL OR 
           (cee.created_at >= date_trunc('month', now()) AND 
            cee.created_at < date_trunc('month', now()) + interval '1 month'))
    GROUP BY creator_record.creator_id
    
    ON CONFLICT (creator_id, month_year) DO UPDATE SET
      total_plays = EXCLUDED.total_plays,
      total_watch_time_minutes = EXCLUDED.total_watch_time_minutes,
      total_downloads = EXCLUDED.total_downloads,
      unique_viewers = EXCLUDED.unique_viewers,
      revenue_generated = EXCLUDED.revenue_generated,
      creator_earnings = EXCLUDED.quality_adjusted_earnings,
      weighted_engagement_score = EXCLUDED.weighted_engagement_score,
      quality_adjusted_earnings = EXCLUDED.quality_adjusted_earnings,
      content_type_breakdown = EXCLUDED.content_type_breakdown,
      updated_at = now();
  END LOOP;
END;
$$;