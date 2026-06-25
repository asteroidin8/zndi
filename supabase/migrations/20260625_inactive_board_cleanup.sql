-- 선행 컬럼 보장 (20260624_board_policy_v2.sql 미적용 시 대비)
ALTER TABLE boards ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now();
ALTER TABLE boards ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 비활성 보드 자동 삭제 함수
-- 조건: 전원 미인증 45일 (last_activity_at 기준)
CREATE OR REPLACE FUNCTION cleanup_inactive_boards()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
BEGIN
  -- 45일 이상 비활성 보드 soft delete
  FOR r IN
    SELECT b.id, b.name
    FROM boards b
    WHERE b.deleted_at IS NULL
      AND b.last_activity_at < now() - interval '45 days'
  LOOP
    UPDATE boards SET deleted_at = now() WHERE id = r.id;

    INSERT INTO board_system_messages (board_id, type, actor_nickname)
    VALUES (r.id, 'member_left', '시스템');
  END LOOP;
END;
$$;

-- 비활성 7일 전 경고 대상 조회 함수 (Edge Function에서 호출)
CREATE OR REPLACE FUNCTION get_inactive_warning_boards()
RETURNS TABLE(board_id uuid, board_name text)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT b.id, b.name
  FROM boards b
  WHERE b.deleted_at IS NULL
    AND b.last_activity_at < now() - interval '38 days'
    AND b.last_activity_at >= now() - interval '39 days';
$$;

-- pg_cron 스케줄 (Supabase 대시보드에서 pg_cron 활성화 필요)
-- 매일 자정(UTC) 실행
-- SELECT cron.schedule('cleanup-inactive-boards', '0 0 * * *', 'SELECT cleanup_inactive_boards()');
