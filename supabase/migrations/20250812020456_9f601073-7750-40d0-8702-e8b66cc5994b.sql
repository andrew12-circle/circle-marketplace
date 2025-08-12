-- 1) Create table to store AI-generated goal plans per user
CREATE TABLE IF NOT EXISTS public.goal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal_title TEXT NOT NULL,
  goal_description TEXT,
  timeframe_weeks INTEGER,
  budget_min NUMERIC,
  budget_max NUMERIC,
  kpis JSONB NOT NULL DEFAULT '[]'::jsonb,
  plan JSONB NOT NULL,                         -- structured plan with phases, steps, and mapped services
  recommended_service_ids UUID[] NOT NULL DEFAULT '{}',
  confidence NUMERIC,
  model_used TEXT,
  status TEXT NOT NULL DEFAULT 'draft',        -- draft | active | archived
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Enable Row Level Security
ALTER TABLE public.goal_plans ENABLE ROW LEVEL SECURITY;

-- 3) RLS Policies
DO $$
BEGIN
  -- Users can view their own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='goal_plans' AND policyname='Users can view their own goal plans'
  ) THEN
    CREATE POLICY "Users can view their own goal plans"
    ON public.goal_plans FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  -- Users can insert their own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='goal_plans' AND policyname='Users can insert their own goal plans'
  ) THEN
    CREATE POLICY "Users can insert their own goal plans"
    ON public.goal_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update their own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='goal_plans' AND policyname='Users can update their own goal plans'
  ) THEN
    CREATE POLICY "Users can update their own goal plans"
    ON public.goal_plans FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  -- Users can delete their own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='goal_plans' AND policyname='Users can delete their own goal plans'
  ) THEN
    CREATE POLICY "Users can delete their own goal plans"
    ON public.goal_plans FOR DELETE
    USING (auth.uid() = user_id);
  END IF;

  -- Admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='goal_plans' AND policyname='Admins can view all goal plans'
  ) THEN
    CREATE POLICY "Admins can view all goal plans"
    ON public.goal_plans FOR SELECT
    USING (get_user_admin_status());
  END IF;

  -- Admins can manage all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='goal_plans' AND policyname='Admins can manage goal plans'
  ) THEN
    CREATE POLICY "Admins can manage goal plans"
    ON public.goal_plans FOR ALL
    USING (get_user_admin_status())
    WITH CHECK (get_user_admin_status());
  END IF;
END $$;

-- 4) Trigger to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_goal_plans_updated_at'
  ) THEN
    CREATE TRIGGER update_goal_plans_updated_at
    BEFORE UPDATE ON public.goal_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 5) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_goal_plans_user_id ON public.goal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_plans_created_at ON public.goal_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goal_plans_recommended_service_ids ON public.goal_plans USING GIN (recommended_service_ids);
