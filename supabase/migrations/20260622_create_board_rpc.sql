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

GRANT EXECUTE ON FUNCTION public.create_board(text, text, text) TO authenticated;

-- GRANT
GRANT ALL ON public.boards TO authenticated;
GRANT ALL ON public.board_members TO authenticated;
GRANT ALL ON public.board_daily_progress TO authenticated;
