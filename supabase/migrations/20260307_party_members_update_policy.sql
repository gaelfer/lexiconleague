-- Allow users to update their own party_members row (needed for upsert when creating a new party)
CREATE POLICY "party_members_update_self" ON public.party_members
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
