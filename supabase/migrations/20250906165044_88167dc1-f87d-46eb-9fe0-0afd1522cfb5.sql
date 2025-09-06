
-- 1) Add profiles.tier (default 'free'); treat unauthenticated users as 'guest' in code
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'free';

-- 2) Subscriptions table for Stripe lifecycle
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  current_period_end timestamptz,
  price_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='subscriptions' 
      AND policyname='Users can view their subscriptions'
  ) THEN
    CREATE POLICY "Users can view their subscriptions"
      ON public.subscriptions
      FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END$$;

-- Service role can manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='subscriptions' 
      AND policyname='Service role can manage subscriptions'
  ) THEN
    CREATE POLICY "Service role can manage subscriptions"
      ON public.subscriptions
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);

-- 3) Ensure skus pricing columns exist (public_price required, pro_price optional)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='skus') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='skus' AND column_name='public_price'
    ) THEN
      EXECUTE 'ALTER TABLE public.skus ADD COLUMN public_price numeric';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='skus' AND column_name='pro_price'
    ) THEN
      EXECUTE 'ALTER TABLE public.skus ADD COLUMN pro_price numeric';
    END IF;
  END IF;
END$$;
