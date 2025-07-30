-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.update_video_rating()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.increment_video_views(video_uuid UUID)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.videos 
  SET view_count = view_count + 1 
  WHERE id = video_uuid;
END;
$$;