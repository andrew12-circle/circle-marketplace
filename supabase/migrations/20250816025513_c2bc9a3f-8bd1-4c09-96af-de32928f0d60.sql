
-- Onboarding progress tracking
create table if not exists public.user_onboarding_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  -- simple pointer for routing/resume
  current_step text not null default 'welcome',
  -- per-step flags and any small payloads (e.g., {"profile": true, "verified_numbers": true, ...})
  steps jsonb not null default '{}'::jsonb,
  -- control flags
  is_completed boolean not null default false,
  dismissed boolean not null default false, -- explicitly "skip onboarding"
  version integer not null default 1,
  -- timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint user_onboarding_states_user_unique unique (user_id)
);

alter table public.user_onboarding_states enable row level security;

-- Users can read their own onboarding state
create policy "Users can view their onboarding state"
  on public.user_onboarding_states
  for select
  using (auth.uid() = user_id);

-- Users can insert their own onboarding state
create policy "Users can create their onboarding state"
  on public.user_onboarding_states
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own onboarding state
create policy "Users can update their onboarding state"
  on public.user_onboarding_states
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admins can view all onboarding states (support)
create policy "Admins can view all onboarding states"
  on public.user_onboarding_states
  for select
  using (get_user_admin_status());

-- Keep updated_at fresh on update
create trigger set_user_onboarding_states_updated_at
before update on public.user_onboarding_states
for each row execute function public.update_updated_at_column();
