-- Phase 4: 공동 루틴 보드 — shared routines + photo verification logs

-- ── board_routines ──
CREATE TABLE board_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_routines_board ON board_routines(board_id);

ALTER TABLE board_routines ENABLE ROW LEVEL SECURITY;

-- board members can read routines
CREATE POLICY "board_routines_select"
  ON board_routines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = board_routines.board_id
        AND bm.user_id = auth.uid()
    )
  );

-- board members can create routines
CREATE POLICY "board_routines_insert"
  ON board_routines FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = board_routines.board_id
        AND bm.user_id = auth.uid()
    )
  );

-- creator or board owner can delete
CREATE POLICY "board_routines_delete"
  ON board_routines FOR DELETE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM boards b
      WHERE b.id = board_routines.board_id
        AND b.owner_id = auth.uid()
    )
  );

GRANT ALL ON board_routines TO authenticated;

-- ── board_verification_logs ──
CREATE TABLE board_verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  routine_id uuid NOT NULL REFERENCES board_routines(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_path text NOT NULL,
  memo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bvl_feed ON board_verification_logs(board_id, created_at DESC);

ALTER TABLE board_verification_logs ENABLE ROW LEVEL SECURITY;

-- board members can read logs
CREATE POLICY "bvl_select"
  ON board_verification_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = board_verification_logs.board_id
        AND bm.user_id = auth.uid()
    )
  );

-- board members can insert own logs
CREATE POLICY "bvl_insert"
  ON board_verification_logs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM board_members bm
      WHERE bm.board_id = board_verification_logs.board_id
        AND bm.user_id = auth.uid()
    )
  );

-- own logs can be deleted
CREATE POLICY "bvl_delete"
  ON board_verification_logs FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON board_verification_logs TO authenticated;

-- ── Supabase Storage bucket (run in SQL Editor) ──
-- NOTE: If the bucket doesn't exist, create it from Supabase Dashboard → Storage
-- or uncomment below (requires service_role or supabase_admin):
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('board-photos', 'board-photos', true)
-- ON CONFLICT DO NOTHING;

-- Storage RLS: board members can upload
CREATE POLICY "board_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'board-photos'
    AND auth.uid() IS NOT NULL
  );

-- Storage RLS: anyone can read (public bucket)
CREATE POLICY "board_photos_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'board-photos');

-- Storage RLS: owner can delete own photos
CREATE POLICY "board_photos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'board-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
