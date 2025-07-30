-- Create storage buckets for videos and thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('video-thumbnails', 'video-thumbnails', true);

-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  creator_name TEXT NOT NULL,
  creator_id UUID REFERENCES public.profiles(user_id),
  category TEXT NOT NULL,
  duration TEXT NOT NULL, -- e.g. "12:34"
  video_url TEXT, -- URL to video file in storage
  thumbnail_url TEXT, -- URL to thumbnail in storage
  rating NUMERIC(3,2) DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_pro BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  tags TEXT[],
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'))
);

-- Create video views tracking table
CREATE TABLE public.video_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  watch_duration INTEGER, -- in seconds
  completed BOOLEAN DEFAULT false
);

-- Create video ratings table
CREATE TABLE public.video_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for videos table
CREATE POLICY "Videos are viewable by everyone" 
ON public.videos 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Creators can insert their own videos" 
ON public.videos 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own videos" 
ON public.videos 
FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Admins can manage all videos" 
ON public.videos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND ('admin' = ANY(specialties) OR specialties @> ARRAY['admin'])
  )
);

-- RLS Policies for video_views table
CREATE POLICY "Users can create their own video views" 
ON public.video_views 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own video views" 
ON public.video_views 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Video creators can view their video analytics" 
ON public.video_views 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.videos 
    WHERE id = video_id AND creator_id = auth.uid()
  )
);

-- RLS Policies for video_ratings table
CREATE POLICY "Users can create their own ratings" 
ON public.video_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON public.video_ratings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Ratings are viewable by everyone" 
ON public.video_ratings 
FOR SELECT 
USING (true);

-- Storage policies for videos bucket
CREATE POLICY "Videos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for video-thumbnails bucket
CREATE POLICY "Thumbnails are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'video-thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'video-thumbnails' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'video-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to update video ratings
CREATE OR REPLACE FUNCTION public.update_video_rating()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Trigger to auto-update video ratings
CREATE TRIGGER update_video_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.video_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_video_rating();

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_video_views(video_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.videos 
  SET view_count = view_count + 1 
  WHERE id = video_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX idx_videos_category ON public.videos(category);
CREATE INDEX idx_videos_creator ON public.videos(creator_id);
CREATE INDEX idx_videos_featured ON public.videos(is_featured);
CREATE INDEX idx_videos_pro ON public.videos(is_pro);
CREATE INDEX idx_videos_upload_date ON public.videos(upload_date DESC);
CREATE INDEX idx_video_views_video_id ON public.video_views(video_id);
CREATE INDEX idx_video_ratings_video_id ON public.video_ratings(video_id);