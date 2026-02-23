-- RPC to leave party — bypasses RLS so delete always succeeds before create
CREATE OR REPLACE FUNCTION public.leave_party_rpc()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only delete current user's row; SECURITY DEFINER bypasses RLS
  DELETE FROM party_members WHERE user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_party_rpc() TO authenticated;
