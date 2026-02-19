-- Store which level rewards have been claimed (prevents double-claiming ink drops)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS claimed_level_rewards integer[] DEFAULT '{}'::integer[];
