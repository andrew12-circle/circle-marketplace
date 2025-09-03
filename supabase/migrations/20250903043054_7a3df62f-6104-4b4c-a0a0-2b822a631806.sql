-- Create app_events table for lightweight analytics
CREATE TABLE IF NOT EXISTS public.app_events(
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id),
  name text NOT NULL,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can insert own events" ON public.app_events
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Function to flip Pro only if caller is an admin
CREATE OR REPLACE FUNCTION public.admin_set_pro_status(target_user uuid, pro boolean, actor uuid DEFAULT auth.uid())
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = actor AND COALESCE(p.is_admin, false) = true
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  -- flag this tx so the trigger allows it
  PERFORM set_config('audit.admin_action', 'admin_set_pro_status', true);

  UPDATE public.profiles
  SET is_pro = pro, updated_at = now()
  WHERE user_id = target_user;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_pro_status(uuid, boolean, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_set_pro_status(uuid, boolean, uuid) TO authenticated;

-- Trigger that blocks changing is_pro unless the admin RPC set the flag
CREATE OR REPLACE FUNCTION public.block_direct_pro_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_flag text := current_setting('audit.admin_action', true);
BEGIN
  IF NEW.is_pro IS DISTINCT FROM OLD.is_pro THEN
    IF admin_flag IS DISTINCT FROM 'admin_set_pro_status' THEN
      RAISE EXCEPTION 'direct pro changes are blocked';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;