-- Fix the security definer function by ensuring proper search path
DROP FUNCTION IF EXISTS update_comment_likes_count();

CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.content_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.content_comments 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';