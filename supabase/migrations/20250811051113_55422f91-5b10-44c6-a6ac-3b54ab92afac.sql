-- Create table for client-side errors and CSP violations
create table if not exists public.client_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid null,
  url text,
  component text,
  section text,
  error_type text not null default 'runtime',
  message text,
  stack text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

-- Enable RLS
alter table public.client_errors enable row level security;

-- Policies: allow anonymous inserts, restrict reads to admins
create policy if not exists "Allow inserts from clients (anon or authed)"
  on public.client_errors for insert
  with check (true);

create policy if not exists "Admins can view client errors"
  on public.client_errors for select
  using (get_user_admin_status());

create policy if not exists "Admins can delete client errors"
  on public.client_errors for delete
  using (get_user_admin_status());

-- Helpful index
create index if not exists idx_client_errors_created_at on public.client_errors(created_at desc);
