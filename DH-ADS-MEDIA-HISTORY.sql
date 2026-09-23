-- DH ADS MEDIA V4: persistent AI campaign/analyzer history
create table if not exists public.ad_ai_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null check (kind in ('build','analyze')),
  client_name text,
  title text,
  input_data jsonb not null default '{}'::jsonb,
  result_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ad_ai_history enable row level security;

drop policy if exists "ad history select own" on public.ad_ai_history;
create policy "ad history select own" on public.ad_ai_history for select to authenticated using (auth.uid() = user_id);
drop policy if exists "ad history insert own" on public.ad_ai_history;
create policy "ad history insert own" on public.ad_ai_history for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "ad history delete own" on public.ad_ai_history;
create policy "ad history delete own" on public.ad_ai_history for delete to authenticated using (auth.uid() = user_id);

create index if not exists ad_ai_history_user_created_idx on public.ad_ai_history(user_id, created_at desc);
