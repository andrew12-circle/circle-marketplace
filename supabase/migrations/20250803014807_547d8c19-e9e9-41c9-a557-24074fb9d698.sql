-- Create tables for video interactions
CREATE TABLE IF NOT EXISTS public.content_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'dislike', 'save')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id, interaction_type)
);

-- Create table for channel subscriptions
CREATE TABLE IF NOT EXISTS public.channel_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_id UUID NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, channel_id)
);

-- Create table for comments
CREATE TABLE IF NOT EXISTS public.content_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_id UUID NOT NULL,
  parent_comment_id UUID NULL,
  content TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for comment likes
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- Enable RLS
ALTER TABLE public.content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_interactions
CREATE POLICY "Users can manage their own interactions" ON public.content_interactions
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Interactions are viewable by everyone" ON public.content_interactions
FOR SELECT USING (true);

-- RLS Policies for channel_subscriptions
CREATE POLICY "Users can manage their own subscriptions" ON public.channel_subscriptions
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for content_comments
CREATE POLICY "Users can create comments" ON public.content_comments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.content_comments
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.content_comments
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Comments are viewable by everyone" ON public.content_comments
FOR SELECT USING (true);

-- RLS Policies for comment_likes
CREATE POLICY "Users can manage their own comment likes" ON public.comment_likes
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes
FOR SELECT USING (true);

-- Add foreign key constraints
ALTER TABLE public.content_interactions 
ADD CONSTRAINT fk_content_interactions_content 
FOREIGN KEY (content_id) REFERENCES public.content(id) ON DELETE CASCADE;

ALTER TABLE public.channel_subscriptions 
ADD CONSTRAINT fk_channel_subscriptions_channel 
FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON DELETE CASCADE;

ALTER TABLE public.content_comments 
ADD CONSTRAINT fk_content_comments_content 
FOREIGN KEY (content_id) REFERENCES public.content(id) ON DELETE CASCADE;

ALTER TABLE public.content_comments 
ADD CONSTRAINT fk_content_comments_parent 
FOREIGN KEY (parent_comment_id) REFERENCES public.content_comments(id) ON DELETE CASCADE;

ALTER TABLE public.comment_likes 
ADD CONSTRAINT fk_comment_likes_comment 
FOREIGN KEY (comment_id) REFERENCES public.content_comments(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_content_interactions_content_id ON public.content_interactions(content_id);
CREATE INDEX idx_content_interactions_user_content ON public.content_interactions(user_id, content_id);
CREATE INDEX idx_channel_subscriptions_user_id ON public.channel_subscriptions(user_id);
CREATE INDEX idx_content_comments_content_id ON public.content_comments(content_id);
CREATE INDEX idx_content_comments_parent_id ON public.content_comments(parent_comment_id);
CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);

-- Create function to update comment likes count
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

-- Create trigger for comment likes count
CREATE TRIGGER trigger_update_comment_likes_count
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();