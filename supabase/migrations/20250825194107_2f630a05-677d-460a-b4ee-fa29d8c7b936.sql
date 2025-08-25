
-- Ensure one session row per user to allow clean UPSERTs
create unique index if not exists admin_sessions_user_id_key
on public.admin_sessions(user_id);

-- Create the RPC used by the frontend guard
create or replace function public.start_admin_session()
returns boolean
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_is_admin boolean;
  v_user_id uuid := auth.uid();
  v_headers jsonb;
  v_ip inet;
  v_user_agent text;
  v_token text;
begin
  -- Must be authenticated
  if v_user_id is null then
    return false;
  end if;

  -- Must be admin
  select public.get_user_admin_status() into v_is_admin;
  if not coalesce(v_is_admin, false) then
    return false;
  end if;

  -- Capture basic request context for auditing
  v_headers := current_setting('request.headers', true)::jsonb;
  v_user_agent := coalesce(v_headers->>'user-agent', null);
  v_ip := public.clean_ip_address(coalesce(v_headers->>'x-forwarded-for', v_headers->>'x-real-ip'));

  -- Generate a new session token
  v_token := encode(gen_random_bytes(16), 'hex');

  -- Upsert the admin session for this user
  insert into public.admin_sessions (
    user_id, session_token, ip_address, user_agent, last_activity, expires_at
  ) values (
    v_user_id, v_token, v_ip, v_user_agent, now(), now() + interval '30 minutes'
  )
  on conflict (user_id) do update
    set session_token = excluded.session_token,
        ip_address = excluded.ip_address,
        user_agent = excluded.user_agent,
        last_activity = now(),
        expires_at = now() + interval '30 minutes';

  return true;
end;
$$;
