-- Security fixes: restrict board enumeration + nickname check via RPC

-- 1. Remove overly permissive board select policy
--    (boards_select_by_invite allows ANY user to read ALL boards)
drop policy if exists "boards_select_by_invite" on public.boards;

-- 2. RPC: lookup board by invite code (returns only id, name, member count)
--    security definer = runs with owner privileges, bypassing RLS
create or replace function public.lookup_board_by_invite(code text)
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'id', b.id,
    'name', b.name,
    'max_members', b.max_members,
    'member_count', (select count(*) from board_members bm where bm.board_id = b.id)
  )
  from boards b
  where b.invite_code = code
  limit 1;
$$;

-- 3. RPC: check if nickname is available
create or replace function public.is_nickname_available(name text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from profiles
    where nickname = name
      and user_id != auth.uid()
  );
$$;
