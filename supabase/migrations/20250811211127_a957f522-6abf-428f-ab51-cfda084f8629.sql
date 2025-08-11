-- Phase 1: Database Schema Extensions for Goal-Driven AI System

-- Add goal fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN annual_goal_transactions integer,
ADD COLUMN annual_goal_volume numeric,
ADD COLUMN average_commission_per_deal numeric,
ADD COLUMN primary_challenge text CHECK (primary_challenge IN ('lead_generation', 'branding', 'systems', 'conversion', 'follow_up', 'pricing', 'market_knowledge')),
ADD COLUMN marketing_time_per_week integer,
ADD COLUMN budget_preference text CHECK (budget_preference IN ('low_cost', 'balanced', 'high_investment')) DEFAULT 'balanced',
ADD COLUMN onboarding_completed boolean DEFAULT false,
ADD COLUMN last_assessment_date timestamp with time zone;

-- Create agent performance tracking table
CREATE TABLE public.agent_performance_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year text NOT NULL,
  transactions_closed integer DEFAULT 0,
  volume_closed numeric DEFAULT 0,
  average_commission numeric DEFAULT 0,
  lead_generation_score numeric DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(agent_id, month_year)
);

-- Enable RLS on agent performance tracking
ALTER TABLE public.agent_performance_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for agent performance tracking
CREATE POLICY "Users can view their own performance" 
ON public.agent_performance_tracking 
FOR SELECT 
USING (auth.uid() = agent_id);

CREATE POLICY "Users can insert their own performance" 
ON public.agent_performance_tracking 
FOR INSERT 
WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Users can update their own performance" 
ON public.agent_performance_tracking 
FOR UPDATE 
USING (auth.uid() = agent_id);

CREATE POLICY "Admins can view all performance" 
ON public.agent_performance_tracking 
FOR ALL
USING (get_user_admin_status());

-- Create AI service bundles table
CREATE TABLE public.ai_service_bundles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_name text NOT NULL,
  bundle_type text NOT NULL CHECK (bundle_type IN ('low_cost_quick_wins', 'balanced_growth', 'high_investment_returns')),
  target_challenges text[] DEFAULT '{}',
  service_ids uuid[] DEFAULT '{}',
  estimated_roi_percentage numeric DEFAULT 0,
  implementation_timeline_weeks integer DEFAULT 0,
  total_price numeric DEFAULT 0,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on AI service bundles
ALTER TABLE public.ai_service_bundles ENABLE ROW LEVEL SECURITY;

-- Create policy for service bundles (viewable by all authenticated users)
CREATE POLICY "Service bundles are viewable by authenticated users" 
ON public.ai_service_bundles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can manage service bundles" 
ON public.ai_service_bundles 
FOR ALL
USING (get_user_admin_status());

-- Create goal-based recommendations table
CREATE TABLE public.goal_based_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL CHECK (recommendation_type IN ('service', 'bundle', 'strategy', 'benchmark')),
  service_id uuid,
  bundle_id uuid REFERENCES public.ai_service_bundles(id),
  recommendation_text text NOT NULL,
  confidence_score numeric DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  estimated_roi_percentage numeric DEFAULT 0,
  priority_rank integer DEFAULT 0,
  is_viewed boolean DEFAULT false,
  is_accepted boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on goal-based recommendations
ALTER TABLE public.goal_based_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for goal-based recommendations
CREATE POLICY "Users can view their own recommendations" 
ON public.goal_based_recommendations 
FOR SELECT 
USING (auth.uid() = agent_id);

CREATE POLICY "Users can update their own recommendations" 
ON public.goal_based_recommendations 
FOR UPDATE 
USING (auth.uid() = agent_id);

CREATE POLICY "System can create recommendations" 
ON public.goal_based_recommendations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can manage all recommendations" 
ON public.goal_based_recommendations 
FOR ALL
USING (get_user_admin_status());

-- Create market benchmarks table
CREATE TABLE public.market_benchmarks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_area text NOT NULL,
  state text NOT NULL,
  agent_tier text NOT NULL CHECK (agent_tier IN ('new', 'growing', 'established', 'top_producer')),
  avg_transactions_per_year numeric DEFAULT 0,
  avg_volume_per_year numeric DEFAULT 0,
  avg_commission_per_deal numeric DEFAULT 0,
  benchmark_year integer NOT NULL,
  data_source text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(market_area, state, agent_tier, benchmark_year)
);

-- Enable RLS on market benchmarks
ALTER TABLE public.market_benchmarks ENABLE ROW LEVEL SECURITY;

-- Create policy for market benchmarks (viewable by all authenticated users)
CREATE POLICY "Market benchmarks are viewable by authenticated users" 
ON public.market_benchmarks 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage market benchmarks" 
ON public.market_benchmarks 
FOR ALL
USING (get_user_admin_status());

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_agent_performance_tracking_updated_at
BEFORE UPDATE ON public.agent_performance_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_service_bundles_updated_at
BEFORE UPDATE ON public.ai_service_bundles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goal_based_recommendations_updated_at
BEFORE UPDATE ON public.goal_based_recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_market_benchmarks_updated_at
BEFORE UPDATE ON public.market_benchmarks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();