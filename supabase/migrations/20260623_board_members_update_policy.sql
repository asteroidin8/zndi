-- board_members에 UPDATE 정책 추가 (닉네임 변경 등 본인 행 수정 허용)
CREATE POLICY "board_members_update" ON public.board_members
  FOR UPDATE USING (auth.uid() = user_id);
