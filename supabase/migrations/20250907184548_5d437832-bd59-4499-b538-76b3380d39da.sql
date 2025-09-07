
-- Enable pgvector for semantic search
create extension if not exists vector;

-- 1) Chat history
create table if not exists public.concierge_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  thread_id uuid not null,
  role text not null check (role in ('user','assistant','tool')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.concierge_chat_messages enable row level security;

create index if not exists idx_ccm_thread_created_at on public.concierge_chat_messages(thread_id, created_at);
create index if not exists idx_ccm_user_created_at on public.concierge_chat_messages(user_id, created_at);

create policy "Admins can view all chat messages"
  on public.concierge_chat_messages
  for select
  using (get_user_admin_status());

create policy "Users can view own chat messages"
  on public.concierge_chat_messages
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own chat messages"
  on public.concierge_chat_messages
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own chat messages"
  on public.concierge_chat_messages
  for delete
  using (auth.uid() = user_id);

-- 2) Long-term memory
create table if not exists public.concierge_memory (
  user_id uuid primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.concierge_memory enable row level security;

create policy "Admins can view all memory"
  on public.concierge_memory
  for select
  using (get_user_admin_status());

create policy "Users can manage their own memory"
  on public.concierge_memory
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3) Purchase events (for learning and peer patterns)
create table if not exists public.purchase_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  vendor_id uuid not null,
  sku text not null,
  price numeric not null default 0,
  source text not null check (source in ('marketplace','webhook','manual')),
  created_at timestamptz not null default now()
);
alter table public.purchase_events enable row level security;

create index if not exists idx_purchase_events_user_created on public.purchase_events(user_id, created_at);

create policy "Admins can view all purchases"
  on public.purchase_events
  for select
  using (get_user_admin_status());

create policy "Users can view their own purchases"
  on public.purchase_events
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own purchases"
  on public.purchase_events
  for insert
  with check (auth.uid() = user_id);

create policy "System can manage purchases"
  on public.purchase_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- 4) Knowledge base documents
create table if not exists public.kb_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text not null, -- marketplace | kb | trainer | url
  url text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.kb_documents enable row level security;

create policy "Admins can manage kb documents"
  on public.kb_documents
  for all
  using (get_user_admin_status())
  with check (get_user_admin_status());

create policy "Anyone can read kb documents"
  on public.kb_documents
  for select
  using (true);

-- 5) Knowledge base chunks (pgvector)
create table if not exists public.kb_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.kb_documents(id) on delete cascade,
  content text not null,
  embedding vector(1536) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.kb_chunks enable row level security;

create index if not exists idx_kb_chunks_doc on public.kb_chunks(document_id);
-- cosine distance for semantic search
create index if not exists idx_kb_chunks_embedding on public.kb_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create policy "Admins can manage kb chunks"
  on public.kb_chunks
  for all
  using (get_user_admin_status())
  with check (get_user_admin_status());

create policy "Anyone can read kb chunks"
  on public.kb_chunks
  for select
  using (true);

-- 6) Feedback tied to assistant answers
create table if not exists public.concierge_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  answer_id uuid not null, -- references concierge_chat_messages.id where role='assistant'
  helpful boolean not null,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.concierge_feedback enable row level security;

create index if not exists idx_feedback_user_created on public.concierge_feedback(user_id, created_at);

create policy "Admins can view all feedback"
  on public.concierge_feedback
  for select
  using (get_user_admin_status());

create policy "Users can manage their own feedback"
  on public.concierge_feedback
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 7) Market pulse / peer patterns (nightly job writes here)
create table if not exists public.concierge_market_pulse (
  id uuid primary key default gen_random_uuid(),
  cohort_key text, -- e.g., "region=CA|price_band=600k-900k"
  insights jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now()
);
alter table public.concierge_market_pulse enable row level security;

create index if not exists idx_cmp_generated_at on public.concierge_market_pulse(generated_at desc);
create index if not exists idx_cmp_cohort on public.concierge_market_pulse(cohort_key);

create policy "Admins and system can manage market pulse"
  on public.concierge_market_pulse
  for all
  using (get_user_admin_status() or auth.role() = 'service_role')
  with check (get_user_admin_status() or auth.role() = 'service_role');

create policy "Anyone can read market pulse"
  on public.concierge_market_pulse
  for select
  using (true);

-- 8) Timestamp helpers
create or replace function public.update_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_kb_documents_updated_at on public.kb_documents;
create trigger trg_kb_documents_updated_at
before update on public.kb_documents
for each row execute function public.update_timestamp();

-- Memory updated_at on upsert/update is already defaulted; add trigger for explicit updates
drop trigger if exists trg_concierge_memory_updated_at on public.concierge_memory;
create trigger trg_concierge_memory_updated_at
before update on public.concierge_memory
for each row execute function public.update_timestamp();
