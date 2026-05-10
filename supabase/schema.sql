-- Missão 4C Control Panel — execute no SQL Editor do Supabase
-- Habilita extensão para gen_random_uuid (geralmente já ativa)

create table if not exists public.application_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company_name text not null,
  applied_at timestamptz not null default now(),
  participant_count int not null default 1 check (participant_count >= 1 and participant_count <= 50),
  participants jsonb not null default '[]'::jsonb,
  ai_report text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists application_records_user_id_idx
  on public.application_records (user_id);

create index if not exists application_records_applied_at_idx
  on public.application_records (applied_at desc);

alter table public.application_records enable row level security;

create policy "application_records_select_own"
  on public.application_records for select
  using (auth.uid() = user_id);

create policy "application_records_insert_own"
  on public.application_records for insert
  with check (auth.uid() = user_id);

create policy "application_records_update_own"
  on public.application_records for update
  using (auth.uid() = user_id);

create policy "application_records_delete_own"
  on public.application_records for delete
  using (auth.uid() = user_id);

-- participants JSON: array de { "id": string, "name": string, "observations": string }
