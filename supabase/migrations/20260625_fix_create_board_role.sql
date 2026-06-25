-- create_board RPC: 생성자를 role='admin'으로 INSERT
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

  INSERT INTO public.board_members (board_id, user_id, nickname, role)
  VALUES (v_board_id, v_user_id, p_nickname, 'admin');

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

-- 기존 보드 생성자(owner_id)의 role을 admin으로 보정
UPDATE public.board_members bm
SET role = 'admin'
FROM public.boards b
WHERE bm.board_id = b.id
  AND bm.user_id = b.owner_id
  AND bm.role != 'admin';
