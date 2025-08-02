-- Create storage buckets for content uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('videos', 'videos', true),
  ('podcasts', 'podcasts', true),
  ('books', 'books', true),
  ('courses', 'courses', true),
  ('playbooks', 'playbooks', true),
  ('content-covers', 'content-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for content uploads
CREATE POLICY "Content creators can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id IN ('videos', 'podcasts', 'books', 'courses', 'playbooks', 'content-covers') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view published content files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id IN ('videos', 'podcasts', 'books', 'courses', 'playbooks', 'content-covers'));

CREATE POLICY "Content creators can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id IN ('videos', 'podcasts', 'books', 'courses', 'playbooks', 'content-covers') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Content creators can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id IN ('videos', 'podcasts', 'books', 'courses', 'playbooks', 'content-covers') 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create creator onboarding table
CREATE TABLE IF NOT EXISTS public.creator_onboarding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step INTEGER NOT NULL DEFAULT 1,
  completed_steps JSONB DEFAULT '[]'::jsonb,
  onboarding_data JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on creator_onboarding
ALTER TABLE public.creator_onboarding ENABLE ROW LEVEL SECURITY;

-- Create policies for creator onboarding
CREATE POLICY "Users can manage their own onboarding" 
ON public.creator_onboarding 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_creator_onboarding_updated_at
  BEFORE UPDATE ON public.creator_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create creator verification requests table
CREATE TABLE IF NOT EXISTS public.creator_verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  social_links JSONB DEFAULT '{}'::jsonb,
  portfolio_links TEXT[],
  bio TEXT,
  experience_years INTEGER,
  specialties TEXT[],
  sample_content_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on creator verification requests
ALTER TABLE public.creator_verification_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for creator verification requests
CREATE POLICY "Users can create their own verification request" 
ON public.creator_verification_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own verification request" 
ON public.creator_verification_requests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their pending verification request" 
ON public.creator_verification_requests 
FOR UPDATE 
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all verification requests" 
ON public.creator_verification_requests 
FOR ALL 
USING (get_user_admin_status());

-- Add trigger to update updated_at
CREATE TRIGGER update_creator_verification_requests_updated_at
  BEFORE UPDATE ON public.creator_verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate creator earnings
CREATE OR REPLACE FUNCTION public.get_creator_earnings_summary(creator_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
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