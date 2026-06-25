-- v2.1.5 + v2.1.6: 데이터 무결성 + 보드 정책 개편

-- ── 1. 개인 루틴/할일 deleted_at (클라우드 동기화) ──
ALTER TABLE routines ADD COLUMN IF NOT EXISTS deleted_at bigint;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS deleted_at bigint;

-- ── 2. 공동 루틴 soft delete ──
ALTER TABLE board_routines ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- board_routines에 UPDATE 정책 추가 (soft delete용)
CREATE POLICY "board_routines_update"
  ON board_routines FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM boards b
      WHERE b.id = board_routines.board_id
        AND b.owner_id = auth.uid()
    )
  );

-- ── 3. 보드 멤버 역할 (admin/member) ──
ALTER TABLE board_members ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';

-- 기존 보드 owner를 admin으로 설정
UPDATE board_members bm
SET role = 'admin'
FROM boards b
WHERE bm.board_id = b.id AND bm.user_id = b.owner_id AND bm.role = 'member';

-- ── 4. 보드 삭제 투표 ──
CREATE TABLE IF NOT EXISTS board_delete_votes (
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (board_id, user_id)
);

ALTER TABLE board_delete_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delete_votes_select"
  ON board_delete_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = board_delete_votes.board_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "delete_votes_insert"
  ON board_delete_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_votes_delete"
  ON board_delete_votes FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON board_delete_votes TO authenticated;

-- ── 5. 보드 시스템 메시지 ──
CREATE TABLE IF NOT EXISTS board_system_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  type text NOT NULL,
  actor_nickname text NOT NULL,
  target_nickname text,
  routine_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bsm_feed ON board_system_messages(board_id, created_at DESC);

ALTER TABLE board_system_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bsm_select"
  ON board_system_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = board_system_messages.board_id
        AND bm.user_id = auth.uid()
    )
  );

CREATE POLICY "bsm_insert"
  ON board_system_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = board_system_messages.board_id
        AND bm.user_id = auth.uid()
    )
  );

GRANT ALL ON board_system_messages TO authenticated;

-- ── 6. 보드 비활성 추적 ──
ALTER TABLE boards ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now();
ALTER TABLE boards ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ── 7. RPCs ──

-- 관리자 위임
CREATE OR REPLACE FUNCTION delegate_admin(p_board_id uuid, p_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM board_members
    WHERE board_id = p_board_id AND user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM board_members
    WHERE board_id = p_board_id AND user_id = p_target_user_id
  ) THEN
    RAISE EXCEPTION 'target_not_member';
  END IF;

  UPDATE board_members SET role = 'member' WHERE board_id = p_board_id AND user_id = auth.uid();
  UPDATE board_members SET role = 'admin' WHERE board_id = p_board_id AND user_id = p_target_user_id;
  UPDATE boards SET owner_id = p_target_user_id WHERE id = p_board_id;
END;
$$;

-- 멤버 추방
CREATE OR REPLACE FUNCTION kick_member(p_board_id uuid, p_target_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM board_members
    WHERE board_id = p_board_id AND user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  IF EXISTS (
    SELECT 1 FROM board_members
    WHERE board_id = p_board_id AND user_id = p_target_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'cannot_kick_admin';
  END IF;

  DELETE FROM board_members WHERE board_id = p_board_id AND user_id = p_target_user_id;
END;
$$;

-- 초대 코드 갱신
CREATE OR REPLACE FUNCTION refresh_invite_code(p_board_id uuid, p_new_code text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM board_members
    WHERE board_id = p_board_id AND user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  UPDATE boards SET invite_code = p_new_code WHERE id = p_board_id;
END;
$$;

-- 공동 루틴 soft delete
CREATE OR REPLACE FUNCTION soft_delete_board_routine(p_board_id uuid, p_routine_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM board_members
    WHERE board_id = p_board_id AND user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'not_admin';
  END IF;

  UPDATE board_routines SET deleted_at = now() WHERE id = p_routine_id AND board_id = p_board_id;
  UPDATE boards SET last_activity_at = now() WHERE id = p_board_id;
END;
$$;

-- 보드 탈퇴 (관리자 자동 위임 포함)
CREATE OR REPLACE FUNCTION leave_board_v2(p_board_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_remaining int;
  v_next_admin uuid;
BEGIN
  SELECT role INTO v_role FROM board_members
  WHERE board_id = p_board_id AND user_id = auth.uid();

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'not_member';
  END IF;

  DELETE FROM board_members WHERE board_id = p_board_id AND user_id = auth.uid();

  SELECT count(*) INTO v_remaining FROM board_members WHERE board_id = p_board_id;

  IF v_remaining = 0 THEN
    UPDATE boards SET deleted_at = now() WHERE id = p_board_id;
    RETURN jsonb_build_object('board_deleted', true);
  END IF;

  IF v_role = 'admin' THEN
    SELECT user_id INTO v_next_admin FROM board_members
    WHERE board_id = p_board_id
    ORDER BY joined_at ASC
    LIMIT 1;

    UPDATE board_members SET role = 'admin' WHERE board_id = p_board_id AND user_id = v_next_admin;
    UPDATE boards SET owner_id = v_next_admin WHERE id = p_board_id;
    RETURN jsonb_build_object('board_deleted', false, 'new_admin', v_next_admin);
  END IF;

  RETURN jsonb_build_object('board_deleted', false);
END;
$$;

-- 삭제 투표 + 전원 동의 시 soft delete
CREATE OR REPLACE FUNCTION vote_delete_board(p_board_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_member_count int;
  v_vote_count int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM board_members
    WHERE board_id = p_board_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_member';
  END IF;

  INSERT INTO board_delete_votes (board_id, user_id)
  VALUES (p_board_id, auth.uid())
  ON CONFLICT DO NOTHING;

  SELECT count(*) INTO v_member_count FROM board_members WHERE board_id = p_board_id;
  SELECT count(*) INTO v_vote_count FROM board_delete_votes WHERE board_id = p_board_id;

  IF v_vote_count >= v_member_count THEN
    UPDATE boards SET deleted_at = now() WHERE id = p_board_id;
    RETURN jsonb_build_object('deleted', true, 'votes', v_vote_count, 'total', v_member_count);
  END IF;

  RETURN jsonb_build_object('deleted', false, 'votes', v_vote_count, 'total', v_member_count);
END;
$$;

-- 삭제 투표 철회
CREATE OR REPLACE FUNCTION unvote_delete_board(p_board_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM board_delete_votes WHERE board_id = p_board_id AND user_id = auth.uid();
END;
$$;

-- 인증 시 last_activity_at 갱신 (기존 insert_verification_log 대체)
CREATE OR REPLACE FUNCTION insert_verification_log(
  p_board_id uuid,
  p_routine_id uuid,
  p_photo_path text,
  p_memo text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
  v_row record;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM board_members bm
    WHERE bm.board_id = p_board_id AND bm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not_member';
  END IF;

  INSERT INTO board_verification_logs (board_id, routine_id, user_id, photo_path, memo)
  VALUES (p_board_id, p_routine_id, auth.uid(), p_photo_path, p_memo)
  RETURNING * INTO v_row;

  UPDATE boards SET last_activity_at = now() WHERE id = p_board_id;

  RETURN to_jsonb(v_row);
END;
$$;

-- GRANT new RPCs
GRANT EXECUTE ON FUNCTION delegate_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION kick_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_invite_code(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_board_routine(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION leave_board_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION vote_delete_board(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION unvote_delete_board(uuid) TO authenticated;
