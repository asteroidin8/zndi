-- ============================================================
-- 2. 보드/그룹 제한 서버 강제
--    create_board RPC에 보드 수 제한 추가
--    초대 코드를 서버에서 생성
-- ============================================================

-- 제한 설정 테이블 (향후 동적 변경 가능)
CREATE TABLE IF NOT EXISTS app_limits (
  key text PRIMARY KEY,
  free_limit int NOT NULL,
  pro_limit int NOT NULL
);

INSERT INTO app_limits (key, free_limit, pro_limit) VALUES
  ('boards', 3, 7),
  ('board_members', 5, 15),
  ('routine_groups', 1, 999),
  ('todo_groups', 1, 999)
ON CONFLICT (key) DO NOTHING;

-- RLS: 누구나 읽기 가능 (제한값은 공개 정보)
ALTER TABLE app_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read app_limits" ON app_limits;
CREATE POLICY "Anyone can read app_limits" ON app_limits
  FOR SELECT USING (true);

-- 헬퍼: 사용자의 Pro 여부
CREATE OR REPLACE FUNCTION is_user_pro(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM profiles WHERE user_id = p_user_id),
    false
  );
$$;

-- 헬퍼: 사용자의 특정 제한값
CREATE OR REPLACE FUNCTION get_user_limit(p_user_id uuid, p_key text)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT CASE
    WHEN is_user_pro(p_user_id) THEN pro_limit
    ELSE free_limit
  END
  FROM app_limits
  WHERE key = p_key;
$$;

-- create_board 업데이트: 보드 수 제한 + 서버 초대코드 생성
CREATE OR REPLACE FUNCTION create_board(
  p_name text,
  p_invite_code text DEFAULT NULL,
  p_nickname text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_max_boards int;
  v_current_boards int;
  v_invite_code text;
  v_board_id uuid;
  v_max_members int;
  v_result jsonb;
BEGIN
  -- 보드 수 제한 확인
  v_max_boards := get_user_limit(v_user_id, 'boards');
  SELECT count(*) INTO v_current_boards
  FROM boards WHERE owner_id = v_user_id;

  IF v_current_boards >= v_max_boards THEN
    RAISE EXCEPTION 'BOARD_LIMIT_EXCEEDED: 보드를 %개까지 만들 수 있어요.', v_max_boards;
  END IF;

  -- 초대 코드: 클라이언트가 보내면 사용, 아니면 서버 생성
  IF p_invite_code IS NOT NULL AND p_invite_code != '' THEN
    v_invite_code := upper(p_invite_code);
  ELSE
    v_invite_code := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
  END IF;

  -- max_members 결정
  v_max_members := get_user_limit(v_user_id, 'board_members');

  -- 보드 생성
  INSERT INTO boards (name, invite_code, owner_id, max_members)
  VALUES (p_name, v_invite_code, v_user_id, v_max_members)
  RETURNING id INTO v_board_id;

  -- 멤버 등록 (관리자)
  INSERT INTO board_members (board_id, user_id, nickname, role)
  VALUES (v_board_id, v_user_id, p_nickname, 'admin');

  SELECT jsonb_build_object(
    'id', v_board_id,
    'name', p_name,
    'invite_code', v_invite_code,
    'owner_id', v_user_id,
    'max_members', v_max_members,
    'created_at', now()
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 루틴 그룹 제한 (routine_groups insert 트리거)
CREATE OR REPLACE FUNCTION check_routine_group_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max int;
  v_current int;
BEGIN
  v_max := get_user_limit(NEW.user_id, 'routine_groups');
  SELECT count(*) INTO v_current
  FROM routine_groups WHERE user_id = NEW.user_id;

  IF v_current >= v_max THEN
    RAISE EXCEPTION 'ROUTINE_GROUP_LIMIT_EXCEEDED: 루틴 그룹을 %개까지 만들 수 있어요.', v_max;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_routine_group_limit ON routine_groups;
CREATE TRIGGER trg_check_routine_group_limit
  BEFORE INSERT ON routine_groups
  FOR EACH ROW
  EXECUTE FUNCTION check_routine_group_limit();

-- 할일 그룹 제한 (todo_groups insert 트리거)
CREATE OR REPLACE FUNCTION check_todo_group_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_max int;
  v_current int;
BEGIN
  v_max := get_user_limit(NEW.user_id, 'todo_groups');
  SELECT count(*) INTO v_current
  FROM todo_groups WHERE user_id = NEW.user_id;

  IF v_current >= v_max THEN
    RAISE EXCEPTION 'TODO_GROUP_LIMIT_EXCEEDED: 할일 그룹을 %개까지 만들 수 있어요.', v_max;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_todo_group_limit ON todo_groups;
CREATE TRIGGER trg_check_todo_group_limit
  BEFORE INSERT ON todo_groups
  FOR EACH ROW
  EXECUTE FUNCTION check_todo_group_limit();

-- 초대코드 서버 생성 RPC (refresh도 서버에서)
CREATE OR REPLACE FUNCTION refresh_invite_code(
  p_board_id uuid,
  p_new_code text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
BEGIN
  -- 관리자 확인
  IF NOT EXISTS (
    SELECT 1 FROM board_members
    WHERE board_id = p_board_id AND user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: 관리자만 초대 코드를 갱신할 수 있어요.';
  END IF;

  IF p_new_code IS NOT NULL AND p_new_code != '' THEN
    v_code := upper(p_new_code);
  ELSE
    v_code := upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
  END IF;

  UPDATE boards SET invite_code = v_code WHERE id = p_board_id;
  RETURN v_code;
END;
$$;
