-- Add preferred vocab level for casual mode (grades 3-8, psat, sat)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vocab_grade text;
