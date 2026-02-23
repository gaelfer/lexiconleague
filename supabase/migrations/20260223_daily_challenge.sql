-- Daily challenge scores table for the global leaderboard
CREATE TABLE IF NOT EXISTS public.daily_challenge_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  challenge_date date NOT NULL,
  best_score integer NOT NULL DEFAULT 0,
  correct integer NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 1,
  username text,
  avatar_config jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, challenge_date)
);

ALTER TABLE public.daily_challenge_scores ENABLE ROW LEVEL SECURITY;

-- Anyone can read scores (public leaderboard)
CREATE POLICY "daily_scores_select" ON public.daily_challenge_scores
  FOR SELECT USING (true);

-- Users can only insert their own scores
CREATE POLICY "daily_scores_insert" ON public.daily_challenge_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own scores
CREATE POLICY "daily_scores_update" ON public.daily_challenge_scores
  FOR UPDATE USING (auth.uid() = user_id);

-- Fast leaderboard lookups by date + score
CREATE INDEX IF NOT EXISTS idx_daily_challenge_date_score
  ON public.daily_challenge_scores (challenge_date DESC, best_score DESC);
