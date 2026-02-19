-- Add avatar_config column to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_config jsonb NOT NULL DEFAULT '{}'::jsonb;

-- RLS: users can read their own profile
CREATE POLICY IF NOT EXISTS "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- RLS: users can update their own avatar_config (and display_name if it exists)
CREATE POLICY IF NOT EXISTS "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
