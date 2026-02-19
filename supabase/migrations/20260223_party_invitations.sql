-- Party invitations: inviter invites invitee, must accept to join
CREATE TABLE IF NOT EXISTS public.party_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(inviter_id, invitee_id),
  CHECK (inviter_id != invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_party_invitations_invitee ON public.party_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_party_invitations_inviter ON public.party_invitations(inviter_id);

ALTER TABLE public.party_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own party invitations"
  ON public.party_invitations FOR SELECT
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can create party invitations"
  ON public.party_invitations FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Invitees can update (accept/decline)"
  ON public.party_invitations FOR UPDATE
  USING (auth.uid() = invitee_id);

CREATE POLICY "Users can delete own invitations"
  ON public.party_invitations FOR DELETE
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);
