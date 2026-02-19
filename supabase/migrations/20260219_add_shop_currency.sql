-- Add Ink Drops currency and shop-related columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ink_drops integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS unlocked_items text[] NOT NULL DEFAULT ARRAY[
    'droplet_01', 'droplet_02',
    'color_#1E293B', 'color_#3B82F6',
    'eyes_01',
    'none'
  ]::text[];

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_reward_claimed_at timestamptz DEFAULT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_streak integer NOT NULL DEFAULT 0;
