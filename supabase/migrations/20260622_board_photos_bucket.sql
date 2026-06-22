-- Storage bucket for board routine verification photos
-- Run once in Supabase Dashboard → SQL Editor

INSERT INTO storage.buckets (id, name, public)
VALUES ('board-photos', 'board-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies (skip if already created from 20260622_board_routines.sql)
DROP POLICY IF EXISTS "board_photos_insert" ON storage.objects;
CREATE POLICY "board_photos_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'board-photos'
    AND auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "board_photos_select" ON storage.objects;
CREATE POLICY "board_photos_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'board-photos');

DROP POLICY IF EXISTS "board_photos_delete" ON storage.objects;
CREATE POLICY "board_photos_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'board-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
