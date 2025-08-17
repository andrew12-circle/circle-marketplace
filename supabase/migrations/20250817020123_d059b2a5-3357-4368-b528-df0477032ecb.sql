
-- 1) Add feed flags to agents
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS data_feed_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_feed_last_sync timestamptz NULL,
  ADD COLUMN IF NOT EXISTS feed_provider text NULL;

-- 2) Create agent_transactions (one row per closing)
CREATE TABLE IF NOT EXISTS public.agent_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  role text NOT NULL, -- 'buyer' | 'seller'
  sale_price numeric NOT NULL DEFAULT 0,
  close_date date,
  source text NOT NULL DEFAULT 'feed', -- 'feed' | 'self_report' (optional)
  external_id text UNIQUE,            -- optional upstream key if provided
  lender text,
  title_company text,
  property_city text,
  property_state text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agent_transactions_role_check CHECK (role IN ('buyer','seller'))
);

-- FK to agents
ALTER TABLE public.agent_transactions
  ADD CONSTRAINT agent_transactions_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;

-- Keep updated_at fresh
CREATE TRIGGER update_agent_transactions_updated_at
BEFORE UPDATE ON public.agent_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.agent_transactions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all
CREATE POLICY "Admins can manage all agent transactions"
  ON public.agent_transactions
  FOR ALL
  USING (get_user_admin_status())
  WITH CHECK (get_user_admin_status());

-- Agents can manage their own transactions
CREATE POLICY "Agents can manage their own agent transactions"
  ON public.agent_transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_transactions.agent_id
        AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_transactions.agent_id
        AND a.user_id = auth.uid()
    )
  );

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_agent_transactions_agent_date
  ON public.agent_transactions(agent_id, close_date);

-- 3) Create agent_quiz_responses (fallback snapshot)
CREATE TABLE IF NOT EXISTS public.agent_quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  buyers_count integer NOT NULL DEFAULT 0,
  sellers_count integer NOT NULL DEFAULT 0,
  avg_price numeric NOT NULL DEFAULT 0,
  period_months integer NOT NULL DEFAULT 12,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_quiz_responses
  ADD CONSTRAINT agent_quiz_responses_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE;

ALTER TABLE public.agent_quiz_responses ENABLE ROW LEVEL SECURITY;

-- Admins can view all quiz responses
CREATE POLICY "Admins can view all agent quiz responses"
  ON public.agent_quiz_responses
  FOR SELECT
  USING (get_user_admin_status());

-- Agents can manage their own quiz responses
CREATE POLICY "Agents can manage their own agent quiz responses"
  ON public.agent_quiz_responses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_quiz_responses.agent_id
        AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_quiz_responses.agent_id
        AND a.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_agent_quiz_responses_agent_created_at
  ON public.agent_quiz_responses(agent_id, created_at DESC);

-- 4) Tag performance rows with data_source
ALTER TABLE public.agent_performance_tracking
  ADD COLUMN IF NOT EXISTS data_source text DEFAULT 'feed';
