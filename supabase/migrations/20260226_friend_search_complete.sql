-- Friend search & profiles: ensure everything needed for autocomplete exists
-- Run after other migrations

-- 1. Profiles: index for fast username prefix search (ilike 'prefix%')
-- Uses lower(username) so case-insensitive search can use the index
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles (lower(username));

-- 2. Profiles: ensure RLS allows reading profiles for friend search
-- (Leaderboard policy already allows SELECT with true; add explicit search policy if desired)
-- The existing "Anyone can read leaderboard" policy covers friend search.

-- 3. Ensure profiles has all columns needed for friend search autocomplete
-- (username, avatar_config, xp for level - all added in prior migrations)

-- 4. Friends: ensure table and RLS exist (from 20260221_add_mmr_friends.sql)
-- Friend requests: from 20260223_friend_requests.sql

-- 5. Add unique index on username for deterministic lookups (optional but recommended)
-- Skip if you want to allow duplicate usernames; add if usernames must be unique
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique ON public.profiles (lower(username)) WHERE username IS NOT NULL;
