-- Create agent archetypes table
CREATE TABLE public.agent_archetypes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  archetype_name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  production_range_min INTEGER NOT NULL DEFAULT 0,
  production_range_max INTEGER NOT NULL DEFAULT 999999,
  team_size_categories TEXT[] NOT NULL DEFAULT '{}',
  preferred_focus TEXT[] NOT NULL DEFAULT '{}',
  pain_points TEXT[] NOT NULL DEFAULT '{}',
  recommended_tools JSONB NOT NULL DEFAULT '{}',
  success_metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_archetypes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Archetypes are viewable by everyone" 
ON public.agent_archetypes 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage archetypes" 
ON public.agent_archetypes 
FOR ALL 
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

-- Create agent success path scores table
CREATE TABLE public.agent_success_path_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  archetype_id UUID REFERENCES public.agent_archetypes(id) ON DELETE SET NULL,
  overall_score INTEGER NOT NULL DEFAULT 0,
  tool_adoption_score INTEGER NOT NULL DEFAULT 0,
  performance_score INTEGER NOT NULL DEFAULT 0,
  growth_score INTEGER NOT NULL DEFAULT 0,
  peer_comparison_percentile INTEGER NOT NULL DEFAULT 50,
  next_recommendations JSONB NOT NULL DEFAULT '[]',
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_success_path_scores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own scores" 
ON public.agent_success_path_scores 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores" 
ON public.agent_success_path_scores 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert/update scores" 
ON public.agent_success_path_scores 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can view all scores" 
ON public.agent_success_path_scores 
FOR ALL 
USING (get_user_admin_status());

-- Create industry benchmarks table
CREATE TABLE public.industry_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  benchmark_type TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  value_numeric NUMERIC,
  value_text TEXT,
  percentile_25 NUMERIC,
  percentile_50 NUMERIC,
  percentile_75 NUMERIC,
  percentile_90 NUMERIC,
  sample_size INTEGER,
  source TEXT NOT NULL,
  data_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(benchmark_type, category, subcategory, data_date)
);

-- Enable RLS
ALTER TABLE public.industry_benchmarks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Benchmarks are viewable by authenticated users" 
ON public.industry_benchmarks 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Only admins can manage benchmarks" 
ON public.industry_benchmarks 
FOR ALL 
USING (get_user_admin_status())
WITH CHECK (get_user_admin_status());

-- Add new columns to profiles table for enhanced assessment
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS team_size TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_focus TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lead_source_preferences TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agent_archetype_id UUID REFERENCES public.agent_archetypes(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS success_path_score INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS peer_rank_percentile INTEGER DEFAULT 50;

-- Seed default agent archetypes
INSERT INTO public.agent_archetypes (archetype_name, description, production_range_min, production_range_max, team_size_categories, preferred_focus, pain_points, recommended_tools, success_metrics) VALUES 
('High Volume Rainmaker', 'Top producers who close 100+ deals annually with large teams', 100, 999999, ARRAY['large_team', 'brokerage'], ARRAY['buyers', 'sellers', 'lead_gen'], ARRAY['systems', 'automation'], '{"crm": ["Follow Up Boss", "KVCore"], "marketing": ["Ylopo", "CINC"], "automation": ["BoomBomb", "Sisu"]}', '{"avg_deals": 150, "avg_volume": 35000000, "team_size": 8}'),

('Solo Grinder', 'Independent agents doing 5-20 deals per year solo', 5, 20, ARRAY['solo'], ARRAY['sphere', 'referrals'], ARRAY['lead_generation', 'time_management'], '{"crm": ["Wise Agent", "Top Producer"], "marketing": ["Social Media", "Referral Systems"], "leads": ["Circle Marketplace", "Sphere"]}', '{"avg_deals": 12, "avg_volume": 2400000, "team_size": 1}'),

('Sphere Builder', 'Mid-tier agents focused on relationship building', 21, 50, ARRAY['solo', 'small_team'], ARRAY['sphere', 'referrals', 'farming'], ARRAY['branding', 'follow_up'], '{"crm": ["Follow Up Boss", "Chime"], "marketing": ["Client Events", "Social Media"], "tools": ["Homebot", "Market Reports"]}', '{"avg_deals": 35, "avg_volume": 8000000, "team_size": 2}'),

('Listing Specialist', 'Agents who focus primarily on seller representation', 15, 75, ARRAY['solo', 'small_team'], ARRAY['sellers', 'farming'], ARRAY['pricing', 'market_knowledge'], '{"crm": ["Any CRM"], "marketing": ["Postcards", "Farming Tools"], "tools": ["CMA Platforms", "Market Analytics"]}', '{"avg_deals": 25, "avg_volume": 6500000, "team_size": 1}'),

('Team Leader', 'Agents with growing teams, 25-75 deals annually', 25, 75, ARRAY['small_team', 'medium_team'], ARRAY['buyers', 'sellers', 'lead_gen'], ARRAY['systems', 'team_management'], '{"crm": ["Follow Up Boss", "KVCore"], "tools": ["Lead Routing", "Team Management"], "marketing": ["Multi-channel"]}', '{"avg_deals": 50, "avg_volume": 12000000, "team_size": 4}');

-- Seed industry benchmarks
INSERT INTO public.industry_benchmarks (benchmark_type, category, subcategory, value_numeric, percentile_25, percentile_50, percentile_75, percentile_90, source) VALUES 
('production', 'deals_per_year', 'all_agents', 12, 5, 12, 25, 50, 'NAR Statistics'),
('production', 'average_sale_price', 'national', 350000, 250000, 350000, 450000, 650000, 'NAR Statistics'),
('production', 'commission_per_deal', 'average', 5000, 3000, 5000, 7500, 12000, 'Industry Analysis'),
('tools', 'crm_adoption', 'follow_up_boss', 35000, NULL, NULL, NULL, NULL, 'Public Data'),
('tools', 'crm_adoption', 'kvcore', 28000, NULL, NULL, NULL, NULL, 'Public Data'),
('tools', 'marketing_spend', 'monthly', 800, 200, 800, 2000, 5000, 'Agent Surveys'),
('performance', 'conversion_rate', 'leads_to_deals', 0.02, 0.01, 0.02, 0.04, 0.08, 'Industry Studies');

-- Create function to calculate and update success path scores
CREATE OR REPLACE FUNCTION public.calculate_success_path_score(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_data RECORD;
  agent_data RECORD;
  tool_score INTEGER := 0;
  performance_score INTEGER := 0;
  growth_score INTEGER := 0;
  overall_score INTEGER := 0;
  archetype_match UUID;
  score_breakdown JSONB;
BEGIN
  -- Get profile data
  SELECT * INTO profile_data
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  IF profile_data.id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Get agent performance data if available
  SELECT * INTO agent_data
  FROM public.agents
  WHERE user_id = p_user_id;
  
  -- Calculate tool adoption score (0-100)
  IF profile_data.current_tools IS NOT NULL THEN
    -- Score based on having essential tools
    IF profile_data.current_tools->>'crm' != 'none' AND profile_data.current_tools->>'crm' IS NOT NULL THEN
      tool_score := tool_score + 25;
    END IF;
    IF profile_data.current_tools->>'marketing_tools' IS NOT NULL THEN
      tool_score := tool_score + 20;
    END IF;
    IF profile_data.current_tools->>'social_media_usage' != 'none' THEN
      tool_score := tool_score + 15;
    END IF;
    -- Additional 40 points for advanced tools and integrations
    tool_score := tool_score + 40;
  END IF;
  
  -- Calculate performance score based on goals vs benchmarks
  IF profile_data.annual_goal_transactions IS NOT NULL THEN
    CASE 
      WHEN profile_data.annual_goal_transactions >= 50 THEN performance_score := 90;
      WHEN profile_data.annual_goal_transactions >= 25 THEN performance_score := 75;
      WHEN profile_data.annual_goal_transactions >= 12 THEN performance_score := 60;
      WHEN profile_data.annual_goal_transactions >= 5 THEN performance_score := 40;
      ELSE performance_score := 20;
    END CASE;
  END IF;
  
  -- Calculate growth score based on assessment completion and engagement
  growth_score := 0;
  IF profile_data.goal_assessment_completed THEN
    growth_score := growth_score + 30;
  END IF;
  IF profile_data.personality_data IS NOT NULL THEN
    growth_score := growth_score + 25;
  END IF;
  IF profile_data.primary_challenge IS NOT NULL THEN
    growth_score := growth_score + 20;
  END IF;
  -- Additional 25 points for marketplace engagement
  growth_score := growth_score + 25;
  
  -- Determine archetype match
  IF profile_data.annual_goal_transactions IS NOT NULL THEN
    SELECT id INTO archetype_match
    FROM public.agent_archetypes
    WHERE profile_data.annual_goal_transactions >= production_range_min 
      AND profile_data.annual_goal_transactions <= production_range_max
    ORDER BY 
      CASE 
        WHEN profile_data.team_size = ANY(team_size_categories) THEN 1
        ELSE 2
      END,
      ABS((production_range_min + production_range_max) / 2 - profile_data.annual_goal_transactions)
    LIMIT 1;
  END IF;
  
  -- Calculate overall score (weighted average)
  overall_score := ROUND((tool_score * 0.4 + performance_score * 0.4 + growth_score * 0.2)::NUMERIC);
  
  -- Create score breakdown
  score_breakdown := jsonb_build_object(
    'tool_adoption', tool_score,
    'performance', performance_score, 
    'growth_engagement', growth_score,
    'calculation_date', now()
  );
  
  -- Update or insert success path score
  INSERT INTO public.agent_success_path_scores (
    user_id, archetype_id, overall_score, tool_adoption_score, 
    performance_score, growth_score, score_breakdown, last_updated
  ) VALUES (
    p_user_id, archetype_match, overall_score, tool_score,
    performance_score, growth_score, score_breakdown, now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    archetype_id = EXCLUDED.archetype_id,
    overall_score = EXCLUDED.overall_score,
    tool_adoption_score = EXCLUDED.tool_adoption_score,
    performance_score = EXCLUDED.performance_score,
    growth_score = EXCLUDED.growth_score,
    score_breakdown = EXCLUDED.score_breakdown,
    last_updated = now();
  
  -- Update profile with current score
  UPDATE public.profiles
  SET 
    success_path_score = overall_score,
    agent_archetype_id = archetype_match
  WHERE user_id = p_user_id;
  
  RETURN overall_score;
END;
$$;