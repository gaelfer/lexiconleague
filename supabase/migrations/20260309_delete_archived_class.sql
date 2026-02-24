-- Allow teachers to permanently delete a class only after it has been archived.
-- Cascades: class_roster_students, class_join_requests (both ON DELETE CASCADE).

CREATE OR REPLACE FUNCTION public.delete_class(p_class_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Only allow deletion of archived classes owned by the current user
  DELETE FROM public.classes
  WHERE id = p_class_id
    AND teacher_user_id = v_uid
    AND archived = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Class not found or must be archived before deletion');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_class(uuid) TO authenticated, service_role;
