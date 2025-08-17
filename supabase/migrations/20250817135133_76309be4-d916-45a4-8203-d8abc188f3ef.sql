-- Add personality and tool tracking columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS personality_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS current_tools jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS work_style_preferences jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS goal_assessment_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS performance_data_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_assessment_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS annual_goal_transactions integer,
ADD COLUMN IF NOT EXISTS annual_goal_volume numeric,
ADD COLUMN IF NOT EXISTS average_commission_per_deal numeric,
ADD COLUMN IF NOT EXISTS primary_challenge text,
ADD COLUMN IF NOT EXISTS marketing_time_per_week integer,
ADD COLUMN IF NOT EXISTS budget_preference text;

-- Create goal_plans table for storing AI-generated plans
CREATE TABLE IF NOT EXISTS public.goal_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_type text NOT NULL DEFAULT 'path_to_goal',
  current_performance jsonb DEFAULT '{}'::jsonb,
  target_goals jsonb DEFAULT '{}'::jsonb,
  personality_constraints jsonb DEFAULT '{}'::jsonb,
  recommended_phases jsonb DEFAULT '[]'::jsonb,
  total_estimated_cost numeric DEFAULT 0,
  estimated_timeline_months integer DEFAULT 12,
  confidence_score numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Enable RLS on goal_plans
ALTER TABLE public.goal_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for goal_plans
CREATE POLICY "Users can view their own goal plans" ON public.goal_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goal plans" ON public.goal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goal plans" ON public.goal_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all goal plans" ON public.goal_plans
  FOR ALL USING (get_user_admin_status());

-- Create goal_plan_interactions table for conversational refinement tracking
CREATE TABLE IF NOT EXISTS public.goal_plan_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_plan_id uuid NOT NULL REFERENCES public.goal_plans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  interaction_type text NOT NULL, -- 'not_my_style', 'regenerate', 'accept', 'modify'
  feedback_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on goal_plan_interactions
ALTER TABLE public.goal_plan_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for goal_plan_interactions
CREATE POLICY "Users can manage their own plan interactions" ON public.goal_plan_interactions
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all plan interactions" ON public.goal_plan_interactions
  FOR SELECT USING (get_user_admin_status());

-- Create trigger for updating goal_plans updated_at
CREATE OR REPLACE FUNCTION public.update_goal_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_goal_plans_updated_at
  BEFORE UPDATE ON public.goal_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_goal_plans_updated_at();