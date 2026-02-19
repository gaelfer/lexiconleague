-- Complete Supabase setup: ensure all tables and policies exist
-- Run after other migrations

-- Profiles: index for username search (autocomplete)
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (lower(username));

-- Friends: allow inserting both directions when accepting (user_id or friend_id = auth.uid())
DROP POLICY IF EXISTS "Users can add friends" ON public.friends;
CREATE POLICY "Users can add friends"
  ON public.friends FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);
