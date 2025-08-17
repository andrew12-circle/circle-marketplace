-- Add missing columns to profiles table if they don't exist
DO $$ 
BEGIN
  -- Add personality and tool tracking columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'personality_data') THEN
    ALTER TABLE public.profiles ADD COLUMN personality_data jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_tools') THEN
    ALTER TABLE public.profiles ADD COLUMN current_tools jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'work_style_preferences') THEN
    ALTER TABLE public.profiles ADD COLUMN work_style_preferences jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'goal_assessment_completed') THEN
    ALTER TABLE public.profiles ADD COLUMN goal_assessment_completed boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'performance_data_complete') THEN
    ALTER TABLE public.profiles ADD COLUMN performance_data_complete boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'annual_goal_transactions') THEN
    ALTER TABLE public.profiles ADD COLUMN annual_goal_transactions integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'annual_goal_volume') THEN
    ALTER TABLE public.profiles ADD COLUMN annual_goal_volume numeric;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'average_commission_per_deal') THEN
    ALTER TABLE public.profiles ADD COLUMN average_commission_per_deal numeric;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'primary_challenge') THEN
    ALTER TABLE public.profiles ADD COLUMN primary_challenge text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'marketing_time_per_week') THEN
    ALTER TABLE public.profiles ADD COLUMN marketing_time_per_week integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'budget_preference') THEN
    ALTER TABLE public.profiles ADD COLUMN budget_preference text;
  END IF;
END $$;