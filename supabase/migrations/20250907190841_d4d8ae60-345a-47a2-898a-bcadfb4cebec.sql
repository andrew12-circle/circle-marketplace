
-- 1) Concierge chat messages
CREATE TABLE IF NOT EXISTS public.concierge_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  thread_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant','tool')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.concierge_chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='concierge_chat_messages' AND policyname='Users can read their own chat messages'
  ) THEN
    CREATE POLICY "Users can read their own chat messages"
      ON public.concierge_chat_messages
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='concierge_chat_messages' AND policyname='Users can insert their own chat messages'
  ) THEN
    CREATE POLICY "Users can insert their own chat messages"
      ON public.concierge_chat_messages
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- 2) Concierge memory (agent profile traits, prefs, etc.)
CREATE TABLE IF NOT EXISTS public.concierge_memory (
  user_id uuid PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.concierge_memory ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='concierge_memory' AND policyname='Users can read their own memory'
  ) THEN
    CREATE POLICY "Users can read their own memory"
      ON public.concierge_memory
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='concierge_memory' AND policyname='Users can upsert their own memory'
  ) THEN
    CREATE POLICY "Users can upsert their own memory"
      ON public.concierge_memory
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own memory"
      ON public.concierge_memory
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- Optional helper trigger to keep updated_at fresh
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_concierge_memory_updated_at') THEN
    CREATE FUNCTION public.update_concierge_memory_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $func$
    BEGIN
      NEW.updated_at := now();
      RETURN NEW;
    END;
    $func$;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_update_concierge_memory_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_concierge_memory_updated_at
    BEFORE UPDATE ON public.concierge_memory
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_concierge_memory_updated_at();
  END IF;
END$$;

-- 3) Purchase events (for learning and peer patterns)
CREATE TABLE IF NOT EXISTS public.purchase_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vendor_id uuid,
  sku text,
  price numeric,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='purchase_events' AND policyname='Users can view their own purchases'
  ) THEN
    CREATE POLICY "Users can view their own purchases"
      ON public.purchase_events
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Allow system (service role) inserts via edge functions. RLS is bypassed by service role, but this mirrors your existing style.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='purchase_events' AND policyname='System can insert purchase events'
  ) THEN
    CREATE POLICY "System can insert purchase events"
      ON public.purchase_events
      FOR INSERT
      WITH CHECK (true);
  END IF;

  -- Optional: admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='purchase_events' AND policyname='Admins can view all purchases'
  ) THEN
    CREATE POLICY "Admins can view all purchases"
      ON public.purchase_events
      FOR SELECT
      USING (get_user_admin_status());
  END IF;
END$$;

-- 4) Knowledge base: documents and chunks with vector(1536)
CREATE TABLE IF NOT EXISTS public.kb_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source text NOT NULL,
  url text,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kb_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.kb_documents(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Vector index for cosine similarity search
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'kb_chunks_embedding_ivfflat_cosine_idx' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX kb_chunks_embedding_ivfflat_cosine_idx
    ON public.kb_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
  END IF;
END$$;

ALTER TABLE public.kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_chunks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Admins manage KB
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='kb_documents' AND policyname='Admins can manage KB documents'
  ) THEN
    CREATE POLICY "Admins can manage KB documents" ON public.kb_documents
    FOR ALL USING (get_user_admin_status()) WITH CHECK (get_user_admin_status());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='kb_chunks' AND policyname='Admins can manage KB chunks'
  ) THEN
    CREATE POLICY "Admins can manage KB chunks" ON public.kb_chunks
    FOR ALL USING (get_user_admin_status()) WITH CHECK (get_user_admin_status());
  END IF;

  -- System (edge functions) can manage KB
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='kb_documents' AND policyname='System can manage KB documents'
  ) THEN
    CREATE POLICY "System can manage KB documents" ON public.kb_documents
    FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='kb_chunks' AND policyname='System can manage KB chunks'
  ) THEN
    CREATE POLICY "System can manage KB chunks" ON public.kb_chunks
    FOR ALL USING (true) WITH CHECK (true);
  END IF;
END$$;

-- 5) Concierge feedback
CREATE TABLE IF NOT EXISTS public.concierge_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  answer_id uuid NOT NULL,
  helpful boolean NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.concierge_feedback ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='concierge_feedback' AND policyname='Users can insert their feedback'
  ) THEN
    CREATE POLICY "Users can insert their feedback"
      ON public.concierge_feedback
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='concierge_feedback' AND policyname='Admins can view all feedback'
  ) THEN
    CREATE POLICY "Admins can view all feedback"
      ON public.concierge_feedback
      FOR SELECT
      USING (get_user_admin_status());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='concierge_feedback' AND policyname='Users can view their own feedback'
  ) THEN
    CREATE POLICY "Users can view their own feedback"
      ON public.concierge_feedback
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- 6) Market pulse storage for nightly job
CREATE TABLE IF NOT EXISTS public.concierge_market_pulse (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region text,
  insight text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.concierge_market_pulse ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- System and admins manage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='concierge_market_pulse' AND policyname='Admins can manage market pulse'
  ) THEN
    CREATE POLICY "Admins can manage market pulse" 
      ON public.concierge_market_pulse
      FOR ALL
      USING (get_user_admin_status()) WITH CHECK (get_user_admin_status());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='concierge_market_pulse' AND policyname='System can manage market pulse'
  ) THEN
    CREATE POLICY "System can manage market pulse" 
      ON public.concierge_market_pulse
      FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- Allow read if you want to surface bullets in UI; otherwise remove
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='concierge_market_pulse' AND policyname='Anyone can read market pulse'
  ) THEN
    CREATE POLICY "Anyone can read market pulse" 
      ON public.concierge_market_pulse
      FOR SELECT
      USING (true);
  END IF;
END$$;
