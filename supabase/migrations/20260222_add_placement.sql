ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS placement_vocab_grade integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS placement_completed boolean DEFAULT false;
