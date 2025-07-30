-- First, let's extend the profiles table to support creator accounts
ALTER TABLE public.profiles 
ADD COLUMN is_creator BOOLEAN DEFAULT false,
ADD COLUMN creator_verified BOOLEAN DEFAULT false,
ADD COLUMN creator_bio TEXT,
ADD COLUMN creator_website TEXT,
ADD COLUMN creator_social_links JSONB DEFAULT '{}',
ADD COLUMN revenue_share_percentage NUMERIC(5,2) DEFAULT 25.00,
ADD COLUMN total_earnings NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN bank_details JSONB DEFAULT '{}', -- encrypted bank info for payouts
ADD COLUMN creator_joined_at TIMESTAMP WITH TIME ZONE;

-- Create content_types enum for better organization
CREATE TYPE content_type AS ENUM (
  'video', 'podcast', 'book', 'course', 'playbook', 'channel'
);

-- Create a universal content table that can handle all content types
CREATE TABLE public.content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.profiles(user_id),
  content_type content_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  duration TEXT, -- For videos/podcasts (e.g., "12:34")
  page_count INTEGER, -- For books/playbooks
  lesson_count INTEGER, -- For courses
  cover_image_url TEXT,
  content_url TEXT, -- Main content file URL
  preview_url TEXT, -- Preview/trailer URL
  tags TEXT[],
  is_pro BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  price NUMERIC(10,2) DEFAULT 0.00, -- Individual pricing if needed
  rating NUMERIC(3,2) DEFAULT 0,
  total_plays INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0.00,
  metadata JSONB DEFAULT '{}', -- Flexible field for content-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Create channels table for creator channels
CREATE TABLE public.channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.profiles(user_id),
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  subscriber_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create content_plays table for detailed analytics
CREATE TABLE public.content_plays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id),
  play_duration INTEGER DEFAULT 0, -- in seconds
  completion_percentage NUMERIC(5,2) DEFAULT 0,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  device_type TEXT,
  location TEXT
);

-- Create revenue_tracking table
CREATE TABLE public.revenue_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.profiles(user_id),
  content_id UUID REFERENCES public.content(id),
  month_year TEXT NOT NULL, -- e.g., "2024-01"
  total_plays INTEGER DEFAULT 0,
  revenue_earned NUMERIC(10,2) DEFAULT 0.00,
  revenue_share_percentage NUMERIC(5,2) DEFAULT 25.00,
  paid_out BOOLEAN DEFAULT false,
  payout_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create content_ratings table (extend from video_ratings)
CREATE TABLE public.content_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(content_id, user_id)
);

-- Create storage buckets for different content types
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('content-covers', 'content-covers', true),
  ('podcasts', 'podcasts', true),
  ('books', 'books', true),
  ('courses', 'courses', true),
  ('playbooks', 'playbooks', true);

-- Enable RLS on all new tables
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content table
CREATE POLICY "Published content is viewable by everyone" 
ON public.content 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Creators can manage their own content" 
ON public.content 
FOR ALL 
USING (auth.uid() = creator_id);

CREATE POLICY "Admins can manage all content" 
ON public.content 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND ('admin' = ANY(specialties) OR specialties @> ARRAY['admin'])
  )
);

-- RLS Policies for channels
CREATE POLICY "Channels are viewable by everyone" 
ON public.channels 
FOR SELECT 
USING (true);

CREATE POLICY "Creators can manage their own channels" 
ON public.channels 
FOR ALL 
USING (auth.uid() = creator_id);

-- RLS Policies for content_plays
CREATE POLICY "Users can create content plays" 
ON public.content_plays 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can view their content analytics" 
ON public.content_plays 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.content 
    WHERE id = content_id AND creator_id = auth.uid()
  )
);

-- RLS Policies for revenue_tracking
CREATE POLICY "Creators can view their own revenue" 
ON public.revenue_tracking 
FOR SELECT 
USING (auth.uid() = creator_id);

CREATE POLICY "Admins can manage all revenue" 
ON public.revenue_tracking 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND ('admin' = ANY(specialties) OR specialties @> ARRAY['admin'])
  )
);

-- RLS Policies for content_ratings
CREATE POLICY "Users can create ratings" 
ON public.content_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON public.content_ratings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Ratings are viewable by everyone" 
ON public.content_ratings 
FOR SELECT 
USING (true);

-- Storage policies for content covers
CREATE POLICY "Content covers are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'content-covers');

CREATE POLICY "Creators can upload content covers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'content-covers' AND auth.role() = 'authenticated');

-- Storage policies for other content types
CREATE POLICY "Content files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id IN ('podcasts', 'books', 'courses', 'playbooks'));

CREATE POLICY "Creators can upload content files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id IN ('podcasts', 'books', 'courses', 'playbooks') AND auth.role() = 'authenticated');

-- Function to update content ratings
CREATE OR REPLACE FUNCTION public.update_content_rating()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Trigger to auto-update content ratings
CREATE TRIGGER update_content_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.content_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_content_rating();

-- Function to increment content plays
CREATE OR REPLACE FUNCTION public.increment_content_plays(content_uuid UUID)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.content 
  SET total_plays = total_plays + 1 
  WHERE id = content_uuid;
END;
$$;

-- Function to calculate monthly revenue for creators
CREATE OR REPLACE FUNCTION public.calculate_monthly_revenue(target_month TEXT)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create indexes for better performance
CREATE INDEX idx_content_creator ON public.content(creator_id);
CREATE INDEX idx_content_type ON public.content(content_type);
CREATE INDEX idx_content_published ON public.content(is_published);
CREATE INDEX idx_content_plays_content_id ON public.content_plays(content_id);
CREATE INDEX idx_content_plays_date ON public.content_plays(played_at);
CREATE INDEX idx_revenue_tracking_creator ON public.revenue_tracking(creator_id);
CREATE INDEX idx_revenue_tracking_month ON public.revenue_tracking(month_year);