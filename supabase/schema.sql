create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  package_name text not null,
  start_date date,
  end_date date,
  status text not null default 'active',
  outstanding numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  title text not null,
  due_date timestamptz,
  priority text not null default 'normal',
  status text not null default 'todo',
  created_at timestamptz default now()
);

create table if not exists content_progress (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  cycle_start date not null,
  cycle_end date not null,
  posts_done int not null default 0,
  reels_done int not null default 0,
  stories_done int not null default 0,
  plan_done boolean not null default false,
  ads_active boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  amount numeric(10,2) not null,
  type text not null default 'due',
  due_date date,
  paid_at timestamptz,
  created_at timestamptz default now()
);
