-- Class join requests: students request to join, teachers approve and assign names

CREATE TABLE IF NOT EXISTS public.class_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  assigned_display_name text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_class_join_requests_class_status ON public.class_join_requests(class_id, status);
CREATE INDEX IF NOT EXISTS idx_class_join_requests_user ON public.class_join_requests(user_id);

ALTER TABLE public.class_join_requests ENABLE ROW LEVEL SECURITY;

-- Teachers can manage requests for their classes
CREATE POLICY "Teachers can read own class requests"
  ON public.class_join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_join_requests.class_id AND c.teacher_user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update own class requests"
  ON public.class_join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_join_requests.class_id AND c.teacher_user_id = auth.uid()
    )
  );

-- Users can insert their own requests
CREATE POLICY "Users can insert own join requests"
  ON public.class_join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own requests
CREATE POLICY "Users can read own join requests"
  ON public.class_join_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Replace join_class_as_student with request_class_join
CREATE OR REPLACE FUNCTION public.request_class_join(p_join_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_class public.classes%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sign in to request to join a class');
  END IF;

  SELECT * INTO v_class
  FROM public.classes
  WHERE upper(trim(join_code)) = upper(trim(p_join_code))
    AND archived = false
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired class code');
  END IF;

  -- Already in roster?
  IF EXISTS (
    SELECT 1 FROM public.class_roster_students
    WHERE class_id = v_class.id AND linked_user_id = v_uid
  ) THEN
    RETURN jsonb_build_object('success', true, 'class_id', v_class.id, 'already_member', true);
  END IF;

  -- Already has pending request?
  IF EXISTS (
    SELECT 1 FROM public.class_join_requests
    WHERE class_id = v_class.id AND user_id = v_uid AND status = 'pending'
  ) THEN
    RETURN jsonb_build_object('success', true, 'class_id', v_class.id, 'pending', true);
  END IF;

  -- Create pending request
  INSERT INTO public.class_join_requests (class_id, user_id, status)
  VALUES (v_class.id, v_uid, 'pending')
  ON CONFLICT (class_id, user_id) DO UPDATE SET status = 'pending', reviewed_by = NULL, reviewed_at = NULL, assigned_display_name = NULL;

  RETURN jsonb_build_object('success', true, 'class_id', v_class.id, 'pending', true);
END;
$$;

-- List pending join requests for a class (teacher only)
CREATE OR REPLACE FUNCTION public.list_class_join_requests(p_class_id uuid)
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

  IF NOT EXISTS (
    SELECT 1 FROM public.classes c WHERE c.id = p_class_id AND c.teacher_user_id = v_uid
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Class not found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'rows', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'user_id', r.user_id,
          'status', r.status,
          'assigned_display_name', r.assigned_display_name,
          'created_at', r.created_at,
          'username', (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = r.user_id),
          'email', (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = r.user_id),
          'avatar_config', (SELECT avatar_config FROM public.profiles WHERE id = r.user_id)
        )
        ORDER BY r.created_at ASC
      )
      FROM public.class_join_requests r
      WHERE r.class_id = p_class_id AND r.status = 'pending'
    ), '[]'::jsonb)
  );
END;
$$;

-- Teacher approves a request and assigns display name
CREATE OR REPLACE FUNCTION public.approve_class_join_request(
  p_request_id uuid,
  p_display_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_req public.class_join_requests%ROWTYPE;
  v_class public.classes%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_req
  FROM public.class_join_requests
  WHERE id = p_request_id AND status = 'pending'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;

  SELECT * INTO v_class
  FROM public.classes
  WHERE id = v_req.class_id AND teacher_user_id = v_uid
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Class not found');
  END IF;

  IF nullif(trim(p_display_name), '') IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Display name is required');
  END IF;

  -- Add to roster
  BEGIN
    INSERT INTO public.class_roster_students (class_id, display_name, linked_user_id)
    VALUES (v_class.id, trim(p_display_name), v_req.user_id);
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object('success', false, 'error', 'Display name already taken in this class');
  END;

  -- Mark request approved
  UPDATE public.class_join_requests
  SET status = 'approved', assigned_display_name = trim(p_display_name), reviewed_by = v_uid, reviewed_at = now()
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Teacher rejects a request
CREATE OR REPLACE FUNCTION public.reject_class_join_request(p_request_id uuid)
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

  UPDATE public.class_join_requests
  SET status = 'rejected', reviewed_by = v_uid, reviewed_at = now()
  WHERE id = p_request_id
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.classes c
      WHERE c.id = class_join_requests.class_id AND c.teacher_user_id = v_uid
    );

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Drop old join_class_as_student, grant new functions
DROP FUNCTION IF EXISTS public.join_class_as_student(text, text);

GRANT EXECUTE ON FUNCTION public.request_class_join(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_class_join_requests(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_class_join_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_class_join_request(uuid) TO authenticated;
