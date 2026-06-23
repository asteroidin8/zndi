-- routine_groups
create table if not exists public.routine_groups (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  sort_order int not null default 0,
  collapsed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- todo_groups
create table if not exists public.todo_groups (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  name text not null,
  sort_order int not null default 0,
  collapsed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.routine_groups enable row level security;
alter table public.todo_groups enable row level security;

create policy "routine_groups_own" on public.routine_groups for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "todo_groups_own" on public.todo_groups for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
