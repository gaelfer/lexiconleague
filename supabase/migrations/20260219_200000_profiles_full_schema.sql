-- Full profiles table schema for Lexicon League
-- Adds all required columns (profiles table created in 20260219_000000_create_profiles.sql)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text DEFAULT 'Challenger';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rank_tier text DEFAULT 'Bronze';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trophies integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ink_drops integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS unlocked_items text[] DEFAULT ARRAY['droplet_01', 'droplet_02', 'color_#1E293B', 'color_#3B82F6', 'eyes_01', 'none']::text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_reward_claimed_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_streak integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_config jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username_changed_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update defaults for existing rows
UPDATE public.profiles SET username = COALESCE(username, 'Challenger') WHERE username IS NULL;
UPDATE public.profiles SET rank_tier = COALESCE(rank_tier, 'Bronze') WHERE rank_tier IS NULL;
UPDATE public.profiles SET trophies = COALESCE(trophies, 0) WHERE trophies IS NULL;
UPDATE public.profiles SET xp = COALESCE(xp, 0) WHERE xp IS NULL;
UPDATE public.profiles SET ink_drops = COALESCE(ink_drops, 0) WHERE ink_drops IS NULL;
UPDATE public.profiles SET avatar_config = COALESCE(avatar_config, '{}'::jsonb) WHERE avatar_config IS NULL;

-- Trigger: create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  display_name text;
BEGIN
  display_name := COALESCE(
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'full_name',
    split_part(new.email, '@', 1),
    'Challenger'
  );
  INSERT INTO public.profiles (id, username, email, updated_at)
  VALUES (
    new.id,
    display_name,
    new.email,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    updated_at = now();
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow reading leaderboard (top 100 by trophies)
DROP POLICY IF EXISTS "Anyone can read leaderboard" ON public.profiles;
CREATE POLICY "Anyone can read leaderboard"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
