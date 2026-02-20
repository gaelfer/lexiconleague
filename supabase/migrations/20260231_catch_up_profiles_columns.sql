-- Catch-up: add any missing columns the app expects
-- Run in Supabase Dashboard → SQL Editor if you get "Could not find column" errors
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ranked_win_streak integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mmr integer DEFAULT 1000;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS placement_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS placement_vocab_grade integer;
