-- ── Study Mode: streak + mastery persistence ──────────────────────────────────

-- Add study streak columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS study_streak integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_study_session_at timestamptz;

-- Word mastery table: tracks per-word mastery percent for each user
CREATE TABLE IF NOT EXISTS public.word_mastery (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id      text        NOT NULL,
  tier         text        NOT NULL,
  unit         text        NOT NULL,
  mastery_pct  integer     NOT NULL DEFAULT 0 CHECK (mastery_pct >= 0 AND mastery_pct <= 100),
  correct_count  integer   NOT NULL DEFAULT 0,
  attempt_count  integer   NOT NULL DEFAULT 0,
  last_seen_at   timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, word_id)
);

-- RLS for word_mastery
ALTER TABLE public.word_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own word mastery"
  ON public.word_mastery FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own word mastery"
  ON public.word_mastery FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own word mastery"
  ON public.word_mastery FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast lookups by user + tier
CREATE INDEX IF NOT EXISTS word_mastery_user_tier_idx
  ON public.word_mastery (user_id, tier);

-- RPC: upsert word mastery (increment correct/attempt counts, update mastery_pct)
CREATE OR REPLACE FUNCTION public.upsert_word_mastery(
  p_user_id      uuid,
  p_word_id      text,
  p_tier         text,
  p_unit         text,
  p_correct      boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempts   integer;
  v_correct    integer;
  v_mastery    integer;
BEGIN
  INSERT INTO public.word_mastery (user_id, word_id, tier, unit, correct_count, attempt_count, mastery_pct, last_seen_at)
  VALUES (p_user_id, p_word_id, p_tier, p_unit,
          CASE WHEN p_correct THEN 1 ELSE 0 END,
          1,
          CASE WHEN p_correct THEN 20 ELSE 5 END,
          now())
  ON CONFLICT (user_id, word_id) DO UPDATE
    SET attempt_count = word_mastery.attempt_count + 1,
        correct_count = word_mastery.correct_count + CASE WHEN p_correct THEN 1 ELSE 0 END,
        last_seen_at  = now(),
        mastery_pct   = LEAST(100, GREATEST(0,
          -- recalc mastery: weighted toward recent performance
          ROUND((word_mastery.correct_count + CASE WHEN p_correct THEN 1 ELSE 0 END)::numeric
                / (word_mastery.attempt_count + 1) * 100)
        ));
END;
$$;

-- RPC: record a study session and update streak
CREATE OR REPLACE FUNCTION public.record_study_session(
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_session   timestamptz;
  v_streak         integer;
  v_now            timestamptz := now();
  v_today          date := (v_now AT TIME ZONE 'UTC')::date;
  v_last_date      date;
  v_new_streak     integer;
  v_streak_bonus   integer := 0;
BEGIN
  SELECT last_study_session_at, COALESCE(study_streak, 0)
    INTO v_last_session, v_streak
    FROM public.profiles
    WHERE id = p_user_id;

  IF v_last_session IS NULL THEN
    v_new_streak := 1;
  ELSE
    v_last_date := (v_last_session AT TIME ZONE 'UTC')::date;
    IF v_last_date = v_today THEN
      -- Already studied today; keep streak as-is
      v_new_streak := v_streak;
    ELSIF v_last_date = v_today - 1 THEN
      -- Consecutive day
      v_new_streak := v_streak + 1;
    ELSE
      -- Streak broken
      v_new_streak := 1;
    END IF;
  END IF;

  -- Bonus Ink Drops at streak milestones (only awarded when streak increments to milestone)
  IF v_new_streak > v_streak THEN
    CASE v_new_streak
      WHEN 3  THEN v_streak_bonus := 5;
      WHEN 7  THEN v_streak_bonus := 15;
      WHEN 14 THEN v_streak_bonus := 25;
      WHEN 30 THEN v_streak_bonus := 50;
      ELSE v_streak_bonus := 0;
    END CASE;
  END IF;

  UPDATE public.profiles
    SET study_streak          = v_new_streak,
        last_study_session_at = v_now,
        ink_drops             = COALESCE(ink_drops, 0) + v_streak_bonus,
        updated_at            = v_now
    WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'study_streak', v_new_streak,
    'streak_bonus', v_streak_bonus
  );
END;
$$;
