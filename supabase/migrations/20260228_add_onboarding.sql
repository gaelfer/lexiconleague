-- Add onboarding_completed for new-user flow (username + default vocab grade)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT true;

-- Existing users: already onboarded
UPDATE public.profiles SET onboarding_completed = true WHERE onboarding_completed IS NULL;

-- New users: set false in handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  display_name text;
  vocab_grade_val text;
  grade_meta text;
BEGIN
  display_name := COALESCE(
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'full_name',
    split_part(COALESCE(new.email, ''), '@', 1),
    'Challenger'
  );
  -- Map "Grade 4" -> 4, "Grade 5" -> 5, etc. "Other" -> 8
  grade_meta := new.raw_user_meta_data ->> 'grade';
  vocab_grade_val := CASE grade_meta
    WHEN 'Grade 3' THEN '3'
    WHEN 'Grade 4' THEN '4'
    WHEN 'Grade 5' THEN '5'
    WHEN 'Grade 6' THEN '6'
    WHEN 'Grade 7' THEN '7'
    WHEN 'Grade 8' THEN '8'
    WHEN 'PSAT' THEN 'psat'
    WHEN 'SAT' THEN 'sat'
    WHEN 'Other' THEN '8'
    ELSE NULL
  END;

  INSERT INTO public.profiles (id, username, email, vocab_grade, onboarding_completed, updated_at)
  VALUES (
    new.id,
    display_name,
    new.email,
    vocab_grade_val,
    false,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    vocab_grade = COALESCE(EXCLUDED.vocab_grade, public.profiles.vocab_grade),
    onboarding_completed = COALESCE(public.profiles.onboarding_completed, false),
    updated_at = now();
  RETURN new;
END;
$$;
