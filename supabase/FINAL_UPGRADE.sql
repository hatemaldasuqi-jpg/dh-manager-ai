-- DH MANAGER AI FINAL MVP DATABASE UPGRADE
create extension if not exists pgcrypto;

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(12,2),
  posts_target integer not null default 0,
  reels_target integer not null default 0,
  daily_story boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create unique index if not exists packages_unique_name on public.packages ((lower(trim(name))));

alter table public.clients add column if not exists package_id uuid references public.packages(id) on delete set null;
alter table public.clients add column if not exists phone text;
alter table public.clients add column if not exists contract_value numeric(12,2);
alter table public.clients add column if not exists created_at timestamptz not null default now();

alter table public.content_progress add column if not exists updated_at timestamptz default now();
create unique index if not exists content_progress_unique_client on public.content_progress(client_id);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  type text not null check (type in ('income','expense','freelancer')),
  amount numeric(12,2) not null check (amount >= 0),
  title text not null,
  transaction_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  appointment_date date not null,
  appointment_time time,
  notes text,
  status text not null default 'pending' check (status in ('pending','completed','cancelled')),
  created_at timestamptz not null default now()
);

insert into public.packages(name, price, posts_target, reels_target, daily_story, notes)
values
('DH GROWTH',130,10,5,true,'Full social media management'),
('DH STARTER',55,0,0,false,'Starter social media management'),
('WEBSITE',null,0,0,false,'Website project')
on conflict do nothing;

update public.clients c
set package_id = p.id
from public.packages p
where c.package_id is null and lower(trim(c.package_name)) = lower(trim(p.name));

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.packages to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.content_progress to authenticated;
grant select, insert, update, delete on public.financial_transactions to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter table public.packages enable row level security;
alter table public.clients enable row level security;
alter table public.tasks enable row level security;
alter table public.content_progress enable row level security;
alter table public.financial_transactions enable row level security;
alter table public.appointments enable row level security;

do $$
declare t text;
begin
  foreach t in array array['packages','clients','tasks','content_progress','financial_transactions','appointments']
  loop
    execute format('drop policy if exists "auth_all_%s" on public.%I', t, t);
    execute format('create policy "auth_all_%s" on public.%I for all to authenticated using (true) with check (true)', t, t);
  end loop;
end $$;
