-- Add ranked_win_streak column to track consecutive ranked wins
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ranked_win_streak integer NOT NULL DEFAULT 0;
