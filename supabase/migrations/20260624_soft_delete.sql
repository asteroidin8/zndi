ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS deleted_at bigint;
ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS deleted_at bigint;
