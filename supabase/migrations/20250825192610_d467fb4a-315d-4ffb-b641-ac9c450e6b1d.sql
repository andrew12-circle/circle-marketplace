
-- 1) Relax validation so verified admins can access immediately
create or replace function public.validate_admin_session_context()
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select coalesce((
    select is_admin
    from public.profiles
    where user_id = auth.uid()
  ), false)
$$;

-- 2) Simplify RLS on admin_sessions so users can create/refresh their own session rows
drop policy if exists "Enhanced admin session security" on public.admin_sessions;

drop policy if exists "Users can manage their own admin sessions" on public.admin_sessions;
create policy "Users can manage their own admin sessions"
on public.admin_sessions
as permissive
for all
to public
using ((select public.current_user_id()) = user_id)
with check ((select public.current_user_id()) = user_id);
