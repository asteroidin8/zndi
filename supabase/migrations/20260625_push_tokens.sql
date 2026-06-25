-- 푸시 토큰 저장 테이블
CREATE TABLE IF NOT EXISTS push_tokens (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens_own"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON push_tokens TO authenticated;

-- 푸시 토큰 upsert RPC
CREATE OR REPLACE FUNCTION upsert_push_token(p_token text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO push_tokens (user_id, token, updated_at)
  VALUES (auth.uid(), p_token, now())
  ON CONFLICT (user_id)
  DO UPDATE SET token = p_token, updated_at = now();
END;
$$;

-- 보드 멤버들의 푸시 토큰 조회 (Edge Function용)
CREATE OR REPLACE FUNCTION get_board_push_tokens(p_board_id uuid, p_exclude_user_id uuid DEFAULT NULL)
RETURNS TABLE(user_id uuid, token text)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT pt.user_id, pt.token
  FROM push_tokens pt
  JOIN board_members bm ON bm.user_id = pt.user_id
  WHERE bm.board_id = p_board_id
    AND (p_exclude_user_id IS NULL OR pt.user_id != p_exclude_user_id);
$$;
