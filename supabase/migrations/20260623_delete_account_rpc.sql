-- 계정 삭제 RPC: 사용자 본인의 모든 데이터 삭제 후 auth.users에서 제거
-- auth.users 삭제 시 CASCADE로 모든 관련 테이블 데이터 자동 삭제
-- service_role 권한이 필요하므로 SECURITY DEFINER로 실행

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then
    raise exception 'Not authenticated';
  end if;

  -- auth.users 삭제 → CASCADE로 profiles, routines, todos,
  -- routine_completions, fasting_records, sync_state, boards 등 전부 삭제
  delete from auth.users where id = _uid;
end;
$$;

-- 인증된 사용자만 호출 가능
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
