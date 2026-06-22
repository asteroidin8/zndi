-- zndi (잔디) v2 보드 스키마
-- 달성률 보드: 최대 4인 그룹, 콘텐츠 비공개 + 달성률만 공유

-- boards
create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  owner_id uuid not null references auth.users (id) on delete cascade,
  max_members int not null default 4,
  created_at timestamptz not null default now()
);

create index if not exists idx_boards_invite_code on public.boards (invite_code);

-- board members
create table if not exists public.board_members (
  board_id uuid not null references public.boards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nickname text not null,
  joined_at timestamptz not null default now(),
  primary key (board_id, user_id)
);

-- daily progress per member
create table if not exists public.board_daily_progress (
  board_id uuid not null references public.boards (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  date text not null,
  routine_completed int not null default 0,
  routine_total int not null default 0,
  todo_completed int not null default 0,
  todo_total int not null default 0,
  streak int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (board_id, user_id, date)
);

-- RLS
alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.board_daily_progress enable row level security;

-- boards: 멤버만 조회 가능, 소유자만 수정/삭제
create policy "boards_select_member" on public.boards
  for select using (
    exists (select 1 from public.board_members bm where bm.board_id = id and bm.user_id = auth.uid())
  );
create policy "boards_insert_owner" on public.boards
  for insert with check (auth.uid() = owner_id);
create policy "boards_delete_owner" on public.boards
  for delete using (auth.uid() = owner_id);

-- 초대 코드로 보드 조회 (가입 시 필요) — 누구나 코드로 조회 가능
create policy "boards_select_by_invite" on public.boards
  for select using (true);

-- board_members: 같은 보드 멤버만 조회, 본인만 삽입/삭제
create policy "board_members_select" on public.board_members
  for select using (
    exists (select 1 from public.board_members me where me.board_id = board_members.board_id and me.user_id = auth.uid())
  );
create policy "board_members_insert" on public.board_members
  for insert with check (auth.uid() = user_id);
create policy "board_members_delete" on public.board_members
  for delete using (auth.uid() = user_id);

-- board_daily_progress: 같은 보드 멤버만 조회, 본인만 삽입/수정
create policy "board_progress_select" on public.board_daily_progress
  for select using (
    exists (select 1 from public.board_members bm where bm.board_id = board_daily_progress.board_id and bm.user_id = auth.uid())
  );
create policy "board_progress_upsert" on public.board_daily_progress
  for insert with check (auth.uid() = user_id);
create policy "board_progress_update" on public.board_daily_progress
  for update using (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table public.board_members;
alter publication supabase_realtime add table public.board_daily_progress;
