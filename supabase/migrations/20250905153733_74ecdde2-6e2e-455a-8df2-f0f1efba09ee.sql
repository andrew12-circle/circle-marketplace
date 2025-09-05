
-- Create table for per-question DISC answers (no FK to auth.users)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'disc_answers') THEN
    CREATE TABLE public.disc_answers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      disc_result_id uuid NOT NULL REFERENCES public.disc_results(id) ON DELETE CASCADE,
      question_index integer NOT NULL,
      trait text NOT NULL CHECK (trait IN ('D','I','S','C')),
      value integer NOT NULL CHECK (value BETWEEN 1 AND 5),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (disc_result_id, question_index)
    );
  END IF;
END
$$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS disc_answers_user_idx ON public.disc_answers (user_id);
CREATE INDEX IF NOT EXISTS disc_answers_result_idx ON public.disc_answers (disc_result_id);

-- Enable RLS
ALTER TABLE public.disc_answers ENABLE ROW LEVEL SECURITY;

-- Recreate policies (idempotent)
DROP POLICY IF EXISTS "Users can manage their own DISC answers" ON public.disc_answers;
CREATE POLICY "Users can manage their own DISC answers"
ON public.disc_answers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure updated_at trigger exists on disc_answers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'disc_answers_set_updated_at'
  ) THEN
    CREATE TRIGGER disc_answers_set_updated_at
    BEFORE UPDATE ON public.disc_answers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_disc_updated_at();
  END IF;
END
$$;

-- Also ensure disc_results gets updated_at maintained by trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'disc_results_set_updated_at'
  ) THEN
    CREATE TRIGGER disc_results_set_updated_at
    BEFORE UPDATE ON public.disc_results
    FOR EACH ROW
    EXECUTE FUNCTION public.update_disc_updated_at();
  END IF;
END
$$;
