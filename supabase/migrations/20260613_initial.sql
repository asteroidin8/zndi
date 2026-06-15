-- zndi (잔디) cloud backup schema (Supabase free tier)
-- 로컬(AsyncStorage) = 1차 저장, Supabase = 백업 + 다기기 Realtime

-- profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  height_cm numeric,
  weight_kg numeric,
  target_weight_kg numeric,
  age_years int,
  is_male boolean,
  updated_at timestamptz not null default now()
);

-- routines
create table if not exists public.routines (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  repeat_days smallint[] not null default '{}',
  reminder_time text,
  sort_order int not null default 0,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- todos
create table if not exists public.todos (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  title text not null,
  priority text not null check (priority in ('high', 'mid', 'low')),
  due_date text,
  completed_at bigint,
  archived_date text,
  created_at bigint not null,
  sort_order int not null default 0,
  pinned_to_home boolean not null default false,
  pin_order int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- routine completions (key = YYYY-MM-DD:routineId)
create table if not exists public.routine_completions (
  user_id uuid not null references auth.users (id) on delete cascade,
  completion_key text not null,
  completed_at bigint not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, completion_key)
);

-- fasting records
create table if not exists public.fasting_records (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  started_at bigint not null,
  ended_at bigint,
  goal_hours numeric not null,
  result text check (result in ('completed', 'abandoned')),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- sync cursor per user
create table if not exists public.sync_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  last_pushed_at timestamptz,
  last_pulled_at timestamptz
);

-- RLS
alter table public.profiles enable row level security;
alter table public.routines enable row level security;
alter table public.todos enable row level security;
alter table public.routine_completions enable row level security;
alter table public.fasting_records enable row level security;
alter table public.sync_state enable row level security;

create policy "profiles_own" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "routines_own" on public.routines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "todos_own" on public.todos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "completions_own" on public.routine_completions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "fasting_own" on public.fasting_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sync_own" on public.sync_state for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime (Supabase Dashboard에서 publication에 테이블 추가 필요)
alter publication supabase_realtime add table public.routines;
alter publication supabase_realtime add table public.todos;
alter publication supabase_realtime add table public.routine_completions;
