-- Add missing columns for full cloud sync support

-- profiles: nickname
alter table public.profiles add column if not exists nickname text;

-- routines: group_id, repeat_type, month_dates, section
alter table public.routines add column if not exists group_id text;
alter table public.routines add column if not exists repeat_type text not null default 'weekly';
alter table public.routines add column if not exists month_dates smallint[] not null default '{}';
alter table public.routines add column if not exists section text;

-- todos: group_id
alter table public.todos add column if not exists group_id text;

-- weight_records
create table if not exists public.weight_records (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  date text not null,
  weight_kg numeric not null,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.weight_records enable row level security;
create policy "weight_records_own" on public.weight_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
