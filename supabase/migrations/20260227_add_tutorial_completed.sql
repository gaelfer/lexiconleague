-- Track whether a user has completed the first-time tutorial.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tutorial_completed boolean NOT NULL DEFAULT false;
