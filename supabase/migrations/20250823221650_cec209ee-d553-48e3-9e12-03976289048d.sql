
-- =========================================================
-- 1) Stable helpers for JWT & user/tenant claims (public)
--    Avoid modifying Supabase-reserved schemas.
-- =========================================================

create or replace function public.current_jwt()
returns jsonb
language sql
stable
set search_path to public
as $$
  select coalesce(current_setting('request.jwt.claims', true)::jsonb, '{}'::jsonb)
$$;

create or replace function public.current_user_id()
returns uuid
language sql
stable
set search_path to public
as $$
  select nullif(public.current_jwt()->>'sub','')::uuid
$$;

create or replace function public.current_role()
returns text
language sql
stable
set search_path to public
as $$
  select public.current_jwt()->>'role'
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
set search_path to public
as $$
  select nullif(public.current_jwt()->>'tenant_id','')::uuid
$$;

comment on function public.current_jwt is 'Stable helper to read request.jwt.claims once per statement.';
comment on function public.current_user_id is 'Stable helper to read current user id (sub) from JWT.';
comment on function public.current_role is 'Stable helper to read current role from JWT.';
comment on function public.current_tenant_id is 'Stable helper to read tenant_id from JWT.';


-- =========================================================
-- 2) Refactor RLS policies to use helpers
--    Replace per-row auth.uid()/current_setting with SELECT public.current_user_id()
--    Preserve role scopes and commands.
-- =========================================================

-- ========== public.admin_sessions ==========
drop policy if exists "Enhanced admin session security" on public.admin_sessions;
create policy "Enhanced admin session security"
on public.admin_sessions
as permissive
for all
to public
using (
  ((select public.current_user_id()) = user_id)
  and validate_admin_session_context()
  and check_admin_operation_rate_limit_strict()
)
with check (
  ((select public.current_user_id()) = user_id)
  and validate_admin_session_context()
);

drop policy if exists "Users can manage their own admin sessions" on public.admin_sessions;
create policy "Users can manage their own admin sessions"
on public.admin_sessions
as permissive
for all
to public
using ((select public.current_user_id()) = user_id)
with check ((select public.current_user_id()) = user_id);


-- ========== public.agent_relationships ==========
drop policy if exists "Users can delete relationships for their agent" on public.agent_relationships;
create policy "Users can delete relationships for their agent"
on public.agent_relationships
as permissive
for delete
to public
using (
  exists (
    select 1
    from public.agents
    where (
      (agents.id = agent_relationships.agent_a_id)
      or (agents.id = agent_relationships.agent_b_id)
    )
    and agents.user_id = (select public.current_user_id())
  )
);

drop policy if exists "Users can insert relationships for their agent" on public.agent_relationships;
create policy "Users can insert relationships for their agent"
on public.agent_relationships
as permissive
for insert
to public
with check (
  exists (
    select 1
    from public.agents
    where (
      (agents.id = agent_relationships.agent_a_id)
      or (agents.id = agent_relationships.agent_b_id)
    )
    and agents.user_id = (select public.current_user_id())
  )
);

drop policy if exists "Users can manage relationships for their agent" on public.agent_relationships;
create policy "Users can manage relationships for their agent"
on public.agent_relationships
as permissive
for all
to public
using (
  exists (
    select 1
    from public.agents
    where (
      (agents.id = agent_relationships.agent_a_id)
      or (agents.id = agent_relationships.agent_b_id)
    )
    and agents.user_id = (select public.current_user_id())
  )
);

drop policy if exists "Users can update relationships for their agent" on public.agent_relationships;
create policy "Users can update relationships for their agent"
on public.agent_relationships
as permissive
for update
to public
using (
  exists (
    select 1
    from public.agents
    where (
      (agents.id = agent_relationships.agent_a_id)
      or (agents.id = agent_relationships.agent_b_id)
    )
    and agents.user_id = (select public.current_user_id())
  )
);

drop policy if exists "Users can view relationships for their agent" on public.agent_relationships;
create policy "Users can view relationships for their agent"
on public.agent_relationships
as permissive
for select
to public
using (
  exists (
    select 1
    from public.agents
    where (
      (agents.id = agent_relationships.agent_a_id)
      or (agents.id = agent_relationships.agent_b_id)
    )
    and agents.user_id = (select public.current_user_id())
  )
);


-- ========== public.agent_success_path_scores ==========
drop policy if exists "Admins can view all scores" on public.agent_success_path_scores;
create policy "Admins can view all scores"
on public.agent_success_path_scores
as permissive
for all
to public
using (get_user_admin_status());

drop policy if exists "System can insert/update scores" on public.agent_success_path_scores;
create policy "System can insert/update scores"
on public.agent_success_path_scores
as permissive
for all
to public
using (true)
with check (true);

drop policy if exists "Users can update their own scores" on public.agent_success_path_scores;
create policy "Users can update their own scores"
on public.agent_success_path_scores
as permissive
for update
to public
using ((select public.current_user_id()) = user_id);

drop policy if exists "Users can view their own scores" on public.agent_success_path_scores;
create policy "Users can view their own scores"
on public.agent_success_path_scores
as permissive
for select
to public
using ((select public.current_user_id()) = user_id);


-- ========== public.agent_transactions ==========
drop policy if exists "Admins can manage all agent transactions" on public.agent_transactions;
create policy "Admins can manage all agent transactions"
on public.agent_transactions
as permissive
for all
to public
using (get_user_admin_status())
with check (get_user_admin_status());

drop policy if exists "Agents can manage their own agent transactions" on public.agent_transactions;
create policy "Agents can manage their own agent transactions"
on public.agent_transactions
as permissive
for all
to public
using (
  exists (
    select 1
    from public.agents a
    where a.id = agent_transactions.agent_id
      and a.user_id = (select public.current_user_id())
  )
)
with check (
  exists (
    select 1
    from public.agents a
    where a.id = agent_transactions.agent_id
      and a.user_id = (select public.current_user_id())
  )
);


-- ========== public.co_pay_requests ==========
drop policy if exists "Admins can manage all co-pay requests" on public.co_pay_requests;
create policy "Admins can manage all co-pay requests"
on public.co_pay_requests
as permissive
for all
to public
using (get_user_admin_status())
with check (get_user_admin_status());

drop policy if exists "Agents can update their co-pay request details" on public.co_pay_requests;
create policy "Agents can update their co-pay request details"
on public.co_pay_requests
as permissive
for update
to authenticated
using ((select public.current_user_id()) = agent_id)
with check ((select public.current_user_id()) = agent_id);

drop policy if exists "Block anonymous access to co_pay_requests" on public.co_pay_requests;
create policy "Block anonymous access to co_pay_requests"
on public.co_pay_requests
as permissive
for all
to anon
using (false);

drop policy if exists "Users can create their own co-pay requests" on public.co_pay_requests;
create policy "Users can create their own co-pay requests"
on public.co_pay_requests
as permissive
for insert
to public
with check ((select public.current_user_id()) = agent_id);

drop policy if exists "Users can view their own co-pay requests" on public.co_pay_requests;
create policy "Users can view their own co-pay requests"
on public.co_pay_requests
as permissive
for select
to public
using (
  ((select public.current_user_id()) = agent_id)
  or
  ((select public.current_user_id()) = vendor_id)
);

drop policy if exists "Vendors can update their co-pay request responses" on public.co_pay_requests;
create policy "Vendors can update their co-pay request responses"
on public.co_pay_requests
as permissive
for update
to authenticated
using ((select public.current_user_id()) = vendor_id)
with check ((select public.current_user_id()) = vendor_id);


-- ========== public.content_interactions ==========
drop policy if exists "Admins can view all interactions" on public.content_interactions;
create policy "Admins can view all interactions"
on public.content_interactions
as permissive
for select
to authenticated
using (get_user_admin_status() = true);

drop policy if exists "Block anonymous access to interactions" on public.content_interactions;
create policy "Block anonymous access to interactions"
on public.content_interactions
as permissive
for all
to anon
using (false);

drop policy if exists "Content creators can view interactions on their content" on public.content_interactions;
create policy "Content creators can view interactions on their content"
on public.content_interactions
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.content c
    where c.id = content_interactions.content_id
      and c.creator_id = (select public.current_user_id())
  )
);

drop policy if exists "Users can create their own interactions" on public.content_interactions;
create policy "Users can create their own interactions"
on public.content_interactions
as permissive
for insert
to authenticated
with check ((select public.current_user_id()) = user_id);

drop policy if exists "Users can delete their own interactions" on public.content_interactions;
create policy "Users can delete their own interactions"
on public.content_interactions
as permissive
for delete
to authenticated
using ((select public.current_user_id()) = user_id);

drop policy if exists "Users can manage their own interactions" on public.content_interactions;
create policy "Users can manage their own interactions"
on public.content_interactions
as permissive
for all
to public
using ((select public.current_user_id()) = user_id)
with check ((select public.current_user_id()) = user_id);

drop policy if exists "Users can update their own interactions" on public.content_interactions;
create policy "Users can update their own interactions"
on public.content_interactions
as permissive
for update
to authenticated
using ((select public.current_user_id()) = user_id)
with check ((select public.current_user_id()) = user_id);

drop policy if exists "Users can view their own interactions" on public.content_interactions;
create policy "Users can view their own interactions"
on public.content_interactions
as permissive
for select
to authenticated
using ((select public.current_user_id()) = user_id);


-- ========== public.profiles ==========
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles
as permissive
for select
to public
using (get_user_admin_status() = true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
as permissive
for insert
to public
with check ((select public.current_user_id()) = user_id);

drop policy if exists "Users can update their own profiles safely" on public.profiles;
create policy "Users can update their own profiles safely"
on public.profiles
as permissive
for update
to public
using ((select public.current_user_id()) = user_id)
with check (
  (select public.current_user_id()) = user_id
  and (
    get_user_admin_status() = true
    or (
      -- preserve original safe-update invariants through subselects
      is_admin = (select p1.is_admin from public.profiles p1 where p1.user_id = (select public.current_user_id()))
      and creator_verified = (select p2.creator_verified from public.profiles p2 where p2.user_id = (select public.current_user_id()))
      and revenue_share_percentage = (select p3.revenue_share_percentage from public.profiles p3 where p3.user_id = (select public.current_user_id()))
      and total_earnings = (select p4.total_earnings from public.profiles p4 where p4.user_id = (select public.current_user_id()))
      and (case when exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='bank_details')
           then bank_details = (select p5.bank_details from public.profiles p5 where p5.user_id = (select public.current_user_id()))
           else true end)
    )
  )
);

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
on public.profiles
as permissive
for select
to public
using ((select public.current_user_id()) = user_id);


-- =========================================================
-- 3) Supporting indexes for RLS predicates (idempotent)
--    Conditionally create only when columns exist.
-- =========================================================
do $$
declare
  v_exists boolean;
begin
  -- Helper to check column existence and create index if not exists
  -- admin_sessions
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='admin_sessions' and column_name='user_id') then
    execute 'create index if not exists idx_admin_sessions_user_id on public.admin_sessions(user_id)';
  end if;

  -- admin_notes
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='admin_notes' and column_name='created_by') then
    execute 'create index if not exists idx_admin_notes_created_by on public.admin_notes(created_by)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='admin_notes' and column_name='service_id') then
    execute 'create index if not exists idx_admin_notes_service_id on public.admin_notes(service_id)';
  end if;

  -- agents (for joins)
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='agents' and column_name='user_id') then
    execute 'create index if not exists idx_agents_user_id on public.agents(user_id)';
  end if;

  -- agent_relationships
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='agent_relationships' and column_name='agent_a_id') then
    execute 'create index if not exists idx_agent_relationships_a on public.agent_relationships(agent_a_id)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='agent_relationships' and column_name='agent_b_id') then
    execute 'create index if not exists idx_agent_relationships_b on public.agent_relationships(agent_b_id)';
  end if;

  -- agent_success_path_scores
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='agent_success_path_scores' and column_name='user_id') then
    execute 'create index if not exists idx_agent_success_path_scores_user_id on public.agent_success_path_scores(user_id)';
  end if;

  -- agent_transactions
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='agent_transactions' and column_name='agent_id') then
    execute 'create index if not exists idx_agent_transactions_agent_id on public.agent_transactions(agent_id)';
  end if;

  -- agent_performance_tracking
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='agent_performance_tracking' and column_name='user_id') then
    execute 'create index if not exists idx_agent_performance_tracking_user_id on public.agent_performance_tracking(user_id)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='agent_performance_tracking' and column_name='agent_id') then
    execute 'create index if not exists idx_agent_performance_tracking_agent_id on public.agent_performance_tracking(agent_id)';
  end if;

  -- agent_quiz_responses
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='agent_quiz_responses' and column_name='agent_id') then
    execute 'create index if not exists idx_agent_quiz_responses_agent_id on public.agent_quiz_responses(agent_id)';
  end if;

  -- agreement_signatures
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='agreement_signatures' and column_name='signer_id') then
    execute 'create index if not exists idx_agreement_signatures_signer_id on public.agreement_signatures(signer_id)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='agreement_signatures' and column_name='co_pay_request_id') then
    execute 'create index if not exists idx_agreement_signatures_copay_id on public.agreement_signatures(co_pay_request_id)';
  end if;

  -- ai_interaction_logs
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='ai_interaction_logs' and column_name='user_id') then
    execute 'create index if not exists idx_ai_interaction_logs_user_id on public.ai_interaction_logs(user_id)';
  end if;

  -- channel_subscriptions
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='channel_subscriptions' and column_name='user_id') then
    execute 'create index if not exists idx_channel_subscriptions_user_id on public.channel_subscriptions(user_id)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='channel_subscriptions' and column_name='channel_id') then
    execute 'create index if not exists idx_channel_subscriptions_channel_id on public.channel_subscriptions(channel_id)';
  end if;

  -- channels
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='channels' and column_name='creator_id') then
    execute 'create index if not exists idx_channels_creator_id on public.channels(creator_id)';
  end if;

  -- comment_likes
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='comment_likes' and column_name='user_id') then
    execute 'create index if not exists idx_comment_likes_user_id on public.comment_likes(user_id)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='comment_likes' and column_name='comment_id') then
    execute 'create index if not exists idx_comment_likes_comment_id on public.comment_likes(comment_id)';
  end if;

  -- compliance_documents (for co_pay_request_id join and uploaded_by filtering)
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='compliance_documents' and column_name='co_pay_request_id') then
    execute 'create index if not exists idx_compliance_documents_copay_id on public.compliance_documents(co_pay_request_id)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='compliance_documents' and column_name='uploaded_by') then
    execute 'create index if not exists idx_compliance_documents_uploaded_by on public.compliance_documents(uploaded_by)';
  end if;

  -- co_pay_requests
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='co_pay_requests' and column_name='agent_id') then
    execute 'create index if not exists idx_co_pay_requests_agent_id on public.co_pay_requests(agent_id)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='co_pay_requests' and column_name='vendor_id') then
    execute 'create index if not exists idx_co_pay_requests_vendor_id on public.co_pay_requests(vendor_id)';
  end if;

  -- content_interactions
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='content_interactions' and column_name='user_id') then
    execute 'create index if not exists idx_content_interactions_user_id on public.content_interactions(user_id)';
  end if;
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='content_interactions' and column_name='content_id') then
    execute 'create index if not exists idx_content_interactions_content_id on public.content_interactions(content_id)';
  end if;

  -- content (creator_id) if present
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='content' and column_name='creator_id') then
    execute 'create index if not exists idx_content_creator_id on public.content(creator_id)';
  end if;

  -- profiles
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='user_id') then
    execute 'create index if not exists idx_profiles_user_id on public.profiles(user_id)';
  end if;
end $$ language plpgsql;

-- =========================================================
-- End of migration
-- =========================================================
