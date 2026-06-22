-- Phase 3: 친구 잔디 구경 (Follow system + personal daily progress)

-- user_follows
create table if not exists public.user_follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

create index if not exists idx_user_follows_following on public.user_follows (following_id);

-- user_daily_progress (personal, shared with followers)
create table if not exists public.user_daily_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  routine_completed int not null default 0,
  routine_total int not null default 0,
  todo_completed int not null default 0,
  todo_total int not null default 0,
  streak int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- RLS
alter table public.user_follows enable row level security;
alter table public.user_daily_progress enable row level security;

-- user_follows: 본인 팔로우만 관리, 양방향 조회
create policy "follows_select" on public.user_follows
  for select using (auth.uid() = follower_id or auth.uid() = following_id);
create policy "follows_insert" on public.user_follows
  for insert with check (auth.uid() = follower_id and follower_id != following_id);
create policy "follows_delete" on public.user_follows
  for delete using (auth.uid() = follower_id);

-- user_daily_progress: 본인 쓰기, 팔로워 읽기
create policy "progress_own" on public.user_daily_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "progress_followers_read" on public.user_daily_progress
  for select using (
    exists (
      select 1 from public.user_follows
      where follower_id = auth.uid()
        and following_id = user_daily_progress.user_id
    )
  );

-- RPC: 닉네임으로 사용자 검색 (최소 정보만 반환)
create or replace function public.search_users_by_nickname(query text)
returns json
language sql
security definer
set search_path = public
as $$
  select coalesce(
    json_agg(
      json_build_object(
        'user_id', p.user_id,
        'nickname', p.nickname
      )
    ),
    '[]'::json
  )
  from profiles p
  where p.nickname ilike '%' || query || '%'
    and p.user_id != auth.uid()
    and p.nickname is not null
  limit 20;
$$;

-- Realtime
alter publication supabase_realtime add table public.user_follows;
alter publication supabase_realtime add table public.user_daily_progress;

-- GRANT (SQL로 생성한 테이블에 필요)
grant all on public.user_follows to authenticated;
grant all on public.user_daily_progress to authenticated;
