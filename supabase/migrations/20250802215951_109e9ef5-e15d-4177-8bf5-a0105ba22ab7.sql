-- Add playbook-specific fields and agent creator functionality

-- Add playbook-specific columns to content table
ALTER TABLE public.content 
ADD COLUMN IF NOT EXISTS is_agent_playbook BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS agent_tier TEXT, -- 'top_producer', 'million_dollar', 'team_leader', etc.
ADD COLUMN IF NOT EXISTS agent_location TEXT,
ADD COLUMN IF NOT EXISTS agent_years_experience INTEGER,
ADD COLUMN IF NOT EXISTS agent_annual_volume NUMERIC,
ADD COLUMN IF NOT EXISTS tools_mentioned JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS success_metrics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_audience TEXT, -- 'new_agents', 'struggling_agents', 'team_builders', etc.
ADD COLUMN IF NOT EXISTS playbook_price NUMERIC DEFAULT 99.00,
ADD COLUMN IF NOT EXISTS revenue_share_percentage NUMERIC DEFAULT 70.00; -- 70% for playbook creators vs 25% for regular content

-- Update content type enum to include playbook
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'playbook';

-- Create agent playbook templates table
CREATE TABLE IF NOT EXISTS public.agent_playbook_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  template_description TEXT,
  sections JSONB NOT NULL DEFAULT '[]', -- Array of section templates
  estimated_completion_time TEXT,
  difficulty_level TEXT, -- 'beginner', 'intermediate', 'advanced'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default playbook templates
INSERT INTO public.agent_playbook_templates (template_name, template_description, sections, estimated_completion_time, difficulty_level) VALUES
(
  'Lead Generation Mastery',
  'Share your proven lead generation strategies and systems',
  '[
    {"title": "My Story & Background", "description": "Share your journey and credentials", "type": "story"},
    {"title": "Lead Sources Breakdown", "description": "Detailed breakdown of your lead sources and ROI", "type": "data"},
    {"title": "Daily/Weekly Systems", "description": "Your exact daily and weekly routines", "type": "process"},
    {"title": "Tools & Technology Stack", "description": "CRMs, apps, and tools you use", "type": "tools"},
    {"title": "Scripts & Templates", "description": "Your proven scripts and email templates", "type": "resources"},
    {"title": "Common Mistakes to Avoid", "description": "What NOT to do based on your experience", "type": "tips"},
    {"title": "Results & ROI", "description": "Specific numbers and success metrics", "type": "results"}
  ]'::jsonb,
  '2-3 hours',
  'intermediate'
),
(
  'Listing Domination Strategy',
  'Share how you consistently win listings and maximize profits',
  '[
    {"title": "My Market Position", "description": "How you became the go-to listing agent", "type": "story"},
    {"title": "Listing Presentation System", "description": "Your exact listing presentation process", "type": "process"},
    {"title": "Pricing Strategy", "description": "How you price homes to sell fast and for top dollar", "type": "strategy"},
    {"title": "Marketing Arsenal", "description": "All your marketing tools and techniques", "type": "tools"},
    {"title": "Vendor Network", "description": "Your trusted team of photographers, stagers, etc.", "type": "network"},
    {"title": "Negotiation Tactics", "description": "How you handle multiple offers and negotiations", "type": "skills"},
    {"title": "Results Achieved", "description": "Average days on market, price achievements, etc.", "type": "results"}
  ]'::jsonb,
  '2-3 hours',
  'advanced'
),
(
  'Team Building Blueprint',
  'How you scaled from solo agent to successful team leader',
  '[
    {"title": "When to Start Building", "description": "Knowing when you are ready to hire", "type": "strategy"},
    {"title": "Hiring Process", "description": "How to find, interview, and hire great agents", "type": "process"},
    {"title": "Training System", "description": "Your complete new agent training program", "type": "education"},
    {"title": "Commission Structures", "description": "How you structure splits and incentives", "type": "business"},
    {"title": "Team Culture", "description": "Building a winning team environment", "type": "leadership"},
    {"title": "Systems & Accountability", "description": "Tools and processes for team management", "type": "tools"},
    {"title": "Scaling Results", "description": "Team growth metrics and revenue impact", "type": "results"}
  ]'::jsonb,
  '3-4 hours',
  'advanced'
);

-- Create playbook creation progress table
CREATE TABLE IF NOT EXISTS public.playbook_creation_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.agent_playbook_templates(id),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  current_section INTEGER DEFAULT 0,
  completed_sections JSONB DEFAULT '[]',
  draft_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft', -- 'draft', 'review', 'published'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update content type weightings for playbooks
INSERT INTO public.content_type_weightings (content_type, base_weight_percentage, engagement_multiplier) 
VALUES ('playbook', 35.0, 1.5) -- Higher weight for agent playbooks
ON CONFLICT (content_type) DO UPDATE SET
  base_weight_percentage = 35.0,
  engagement_multiplier = 1.5;

-- Enable RLS on new tables
ALTER TABLE public.agent_playbook_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_creation_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for templates (everyone can view)
CREATE POLICY "Templates are viewable by everyone" 
ON public.agent_playbook_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage templates" 
ON public.agent_playbook_templates 
FOR ALL 
USING (get_user_admin_status());

-- RLS policies for playbook progress
CREATE POLICY "Creators can manage their own playbook progress" 
ON public.playbook_creation_progress 
FOR ALL 
USING (auth.uid() = creator_id);

CREATE POLICY "Admins can view all playbook progress" 
ON public.playbook_creation_progress 
FOR SELECT 
USING (get_user_admin_status());

-- Function to calculate agent playbook earnings (70% instead of 25%)
CREATE OR REPLACE FUNCTION public.calculate_agent_playbook_earnings(p_content_id UUID, p_total_revenue NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_playbook BOOLEAN;
  revenue_share NUMERIC;
  creator_earnings NUMERIC;
BEGIN
  -- Check if this is an agent playbook
  SELECT is_agent_playbook, revenue_share_percentage 
  INTO is_playbook, revenue_share
  FROM public.content
  WHERE id = p_content_id;
  
  -- Agent playbooks get higher revenue share (default 70%)
  IF is_playbook = true THEN
    creator_earnings := p_total_revenue * (COALESCE(revenue_share, 70.0) / 100.0);
  ELSE
    -- Regular content gets 25%
    creator_earnings := p_total_revenue * 0.25;
  END IF;
  
  RETURN creator_earnings;
END;
$$;

-- Update creator analytics to handle different revenue shares
CREATE OR REPLACE FUNCTION public.update_playbook_creator_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_month TEXT;
  creator_record RECORD;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');
  
  -- Update analytics for each creator with playbook-specific revenue sharing
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
      -- Use different revenue share based on content type
      COALESCE(SUM(
        CASE 
          WHEN c.is_agent_playbook = true THEN 
            cee.revenue_attributed * (COALESCE(c.revenue_share_percentage, 70.0) / 100.0)
          ELSE 
            cee.revenue_attributed * 0.25
        END
      ), 0)
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
      creator_earnings = EXCLUDED.creator_earnings,
      updated_at = now();
  END LOOP;
END;
$$;