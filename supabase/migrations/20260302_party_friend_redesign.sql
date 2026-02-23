-- ============================================================
-- Party & Friend System Redesign
-- ============================================================
-- Changes:
--   - Drop old party_invitations (no party_id, no persistent party concept)
--   - Drop old friends table (replaced by view over friend_requests)
--   - Create parties, party_members, party_invitations (with party_id), recent_players
--   - Add DB trigger: party dissolves when leader leaves party_members
--   - Add RLS policies for all new tables
-- ============================================================

-- ============================================================
-- 1. DROP OLD TABLES
-- ============================================================

DROP TABLE IF EXISTS public.party_invitations CASCADE;
DROP TABLE IF EXISTS public.friends CASCADE;

-- ============================================================
-- 2. NEW PARTY TABLES
-- ============================================================

CREATE TABLE public.parties (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text NOT NULL UNIQUE,
  leader_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dissolved')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.party_members (
  party_id  uuid NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (party_id, user_id)
);

-- One active party per user at a time
CREATE UNIQUE INDEX party_members_user_unique ON public.party_members(user_id);

CREATE TABLE public.party_invitations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id   uuid NOT NULL REFERENCES public.parties(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(party_id, invitee_id),
  CHECK (inviter_id != invitee_id)
);

-- ============================================================
-- 3. RECENT PLAYERS
-- ============================================================

CREATE TABLE public.recent_players (
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  played_with_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_played_at timestamptz DEFAULT now() NOT NULL,
  games_played   integer DEFAULT 1 NOT NULL,
  PRIMARY KEY (user_id, played_with_id)
);

-- ============================================================
-- 4. FRIENDS VIEW (replaces the friends table)
--    Queries friend_requests as the single source of truth.
-- ============================================================

CREATE OR REPLACE VIEW public.friends_view AS
  SELECT from_user_id AS user_id, to_user_id AS friend_id
    FROM public.friend_requests WHERE status = 'accepted'
  UNION ALL
  SELECT to_user_id AS user_id, from_user_id AS friend_id
    FROM public.friend_requests WHERE status = 'accepted';

-- ============================================================
-- 5. TRIGGER: dissolve party when leader leaves party_members
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_party_leader_leave()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.parties
  SET status = 'dissolved'
  WHERE id = OLD.party_id
    AND leader_id = OLD.user_id
    AND status = 'open';
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_party_leader_leave
AFTER DELETE ON public.party_members
FOR EACH ROW EXECUTE FUNCTION public.handle_party_leader_leave();

-- ============================================================
-- 6. INDEXES
-- ============================================================

CREATE INDEX parties_leader_idx ON public.parties(leader_id);
CREATE INDEX party_invitations_invitee_idx ON public.party_invitations(invitee_id);
CREATE INDEX party_invitations_party_idx ON public.party_invitations(party_id);
CREATE INDEX recent_players_user_idx ON public.recent_players(user_id, last_played_at DESC);

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.party_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_players ENABLE ROW LEVEL SECURITY;

-- parties: any authenticated user can read (needed to join by code)
CREATE POLICY "parties_select" ON public.parties
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "parties_insert" ON public.parties
  FOR INSERT WITH CHECK (auth.uid() = leader_id);

-- Leader can update (e.g., dissolve) their own party
CREATE POLICY "parties_update" ON public.parties
  FOR UPDATE USING (auth.uid() = leader_id);

CREATE POLICY "parties_delete" ON public.parties
  FOR DELETE USING (auth.uid() = leader_id);

-- party_members: members can see all members of their own party
CREATE POLICY "party_members_select" ON public.party_members
  FOR SELECT USING (
    party_id IN (
      SELECT party_id FROM public.party_members pm2 WHERE pm2.user_id = auth.uid()
    )
    OR
    party_id IN (
      SELECT id FROM public.parties p WHERE p.leader_id = auth.uid()
    )
  );

-- Users can insert themselves into a party
CREATE POLICY "party_members_insert_self" ON public.party_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove themselves; leader can remove anyone in their party
CREATE POLICY "party_members_delete" ON public.party_members
  FOR DELETE USING (
    auth.uid() = user_id
    OR
    party_id IN (SELECT id FROM public.parties WHERE leader_id = auth.uid())
  );

-- party_invitations: inviter or invitee can see
CREATE POLICY "party_invitations_select" ON public.party_invitations
  FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- Any party member can send invitations (RLS validates party membership via inviter_id)
CREATE POLICY "party_invitations_insert" ON public.party_invitations
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_id
    AND party_id IN (
      SELECT party_id FROM public.party_members WHERE user_id = auth.uid()
    )
  );

-- Only invitee can accept/decline
CREATE POLICY "party_invitations_update" ON public.party_invitations
  FOR UPDATE USING (auth.uid() = invitee_id);

-- Inviter or invitee can delete
CREATE POLICY "party_invitations_delete" ON public.party_invitations
  FOR DELETE USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- recent_players: users manage their own records only
CREATE POLICY "recent_players_select" ON public.recent_players
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "recent_players_insert" ON public.recent_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recent_players_update" ON public.recent_players
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "recent_players_delete" ON public.recent_players
  FOR DELETE USING (auth.uid() = user_id);
