-- Add repeat_interval column for interval-based repeats (Pro feature)
ALTER TABLE public.routines
  ADD COLUMN IF NOT EXISTS repeat_interval int NOT NULL DEFAULT 1;
