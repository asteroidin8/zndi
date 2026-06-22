-- 보드 생성 RPC: boards + board_members INSERT를 원자적으로 처리
-- SECURITY DEFINER로 RLS 우회

CREATE OR REPLACE FUNCTION create_board(
  p_name text,
  p_invite_code text,
  p_nickname text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_board_id uuid;
  v_board record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.boards (name, invite_code, owner_id)
  VALUES (p_name, p_invite_code, v_user_id)
  RETURNING * INTO v_board;

  v_board_id := v_board.id;

  INSERT INTO public.board_members (board_id, user_id, nickname)
  VALUES (v_board_id, v_user_id, p_nickname);

  RETURN json_build_object(
    'id', v_board_id,
    'name', v_board.name,
    'invite_code', v_board.invite_code,
    'owner_id', v_board.owner_id,
    'max_members', v_board.max_members,
    'created_at', v_board.created_at
  );
END;
$$;

-- 보드 일일 달성률 upsert RPC
CREATE OR REPLACE FUNCTION upsert_board_progress(
  p_board_id uuid,
  p_date text,
  p_routine_completed int,
  p_routine_total int,
  p_todo_completed int,
  p_todo_total int,
  p_streak int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.board_daily_progress
    (board_id, user_id, date, routine_completed, routine_total, todo_completed, todo_total, streak, updated_at)
  VALUES
    (p_board_id, v_user_id, p_date, p_routine_completed, p_routine_total, p_todo_completed, p_todo_total, p_streak, now())
  ON CONFLICT (board_id, user_id, date)
  DO UPDATE SET
    routine_completed = EXCLUDED.routine_completed,
    routine_total = EXCLUDED.routine_total,
    todo_completed = EXCLUDED.todo_completed,
    todo_total = EXCLUDED.todo_total,
    streak = EXCLUDED.streak,
    updated_at = now();
END;
$$;

-- 인증 로그 INSERT RPC
CREATE OR REPLACE FUNCTION insert_verification_log(
  p_board_id uuid,
  p_routine_id uuid,
  p_photo_path text,
  p_memo text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_log record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.board_members
    WHERE board_id = p_board_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Not a board member';
  END IF;

  INSERT INTO public.board_verification_logs
    (board_id, routine_id, user_id, photo_path, memo)
  VALUES
    (p_board_id, p_routine_id, v_user_id, p_photo_path, p_memo)
  RETURNING * INTO v_log;

  RETURN json_build_object(
    'id', v_log.id,
    'board_id', v_log.board_id,
    'routine_id', v_log.routine_id,
    'user_id', v_log.user_id,
    'photo_path', v_log.photo_path,
    'memo', v_log.memo,
    'created_at', v_log.created_at
  );
END;
$$;

-- 공동 루틴 생성 RPC
CREATE OR REPLACE FUNCTION create_board_routine(
  p_board_id uuid,
  p_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_routine record;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.board_members
    WHERE board_id = p_board_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Not a board member';
  END IF;

  INSERT INTO public.board_routines (board_id, name, created_by)
  VALUES (p_board_id, p_name, v_user_id)
  RETURNING * INTO v_routine;

  RETURN json_build_object(
    'id', v_routine.id,
    'board_id', v_routine.board_id,
    'name', v_routine.name,
    'created_by', v_routine.created_by,
    'created_at', v_routine.created_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_board(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_board_progress(uuid, text, int, int, int, int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.insert_verification_log(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_board_routine(uuid, text) TO authenticated;

-- GRANT
GRANT ALL ON public.boards TO authenticated;
GRANT ALL ON public.board_members TO authenticated;
GRANT ALL ON public.board_daily_progress TO authenticated;
GRANT ALL ON public.board_routines TO authenticated;
GRANT ALL ON public.board_verification_logs TO authenticated;
