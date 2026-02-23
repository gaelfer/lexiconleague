-- Teacher onboarding: homeschool vs public, grade, subject

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS teacher_type text CHECK (teacher_type IN ('homeschool', 'public')),
  ADD COLUMN IF NOT EXISTS teacher_grade text,
  ADD COLUMN IF NOT EXISTS teacher_subject text,
  ADD COLUMN IF NOT EXISTS teacher_onboarding_completed boolean NOT NULL DEFAULT false;

-- Homeschool teachers: auto-approve without school verification
CREATE OR REPLACE FUNCTION public.complete_homeschool_teacher_onboarding(
  p_grade text,
  p_subject text DEFAULT NULL
)
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

  UPDATE public.profiles
  SET
    account_type = 'teacher',
    teacher_type = 'homeschool',
    teacher_school_id = NULL,
    teacher_approved = true,
    teacher_verified_at = now(),
    teacher_grade = nullif(trim(p_grade), ''),
    teacher_subject = nullif(trim(p_subject), ''),
    teacher_onboarding_completed = true,
    updated_at = now()
  WHERE id = v_uid;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Public school: extend verification to set onboarding fields
CREATE OR REPLACE FUNCTION public.complete_public_teacher_onboarding(
  p_school_id uuid,
  p_school_email text,
  p_grade text DEFAULT NULL,
  p_subject text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  v_result := public.start_teacher_verification(p_school_id, p_school_email);

  IF (v_result->>'success')::boolean = false THEN
    RETURN v_result;
  END IF;

  UPDATE public.profiles
  SET
    teacher_type = 'public',
    teacher_grade = nullif(trim(p_grade), ''),
    teacher_subject = nullif(trim(p_subject), ''),
    teacher_onboarding_completed = true,
    updated_at = now()
  WHERE id = v_uid;

  RETURN v_result;
END;
$$;

-- Extend get_teacher_portal_status to return onboarding fields
CREATE OR REPLACE FUNCTION public.get_teacher_portal_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile record;
  v_request record;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT id, account_type, teacher_approved, teacher_school_id, teacher_verified_at,
         teacher_type, teacher_grade, teacher_subject, teacher_onboarding_completed
  INTO v_profile
  FROM public.profiles
  WHERE id = v_uid;

  SELECT status, decision_reason, created_at, reviewed_at
  INTO v_request
  FROM public.teacher_verification_requests
  WHERE user_id = v_uid
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'success', true,
    'account_type', coalesce(v_profile.account_type, 'student'),
    'teacher_approved', coalesce(v_profile.teacher_approved, false),
    'teacher_school_id', v_profile.teacher_school_id,
    'teacher_verified_at', v_profile.teacher_verified_at,
    'teacher_type', v_profile.teacher_type,
    'teacher_grade', v_profile.teacher_grade,
    'teacher_subject', v_profile.teacher_subject,
    'teacher_onboarding_completed', coalesce(v_profile.teacher_onboarding_completed, false),
    'verification_status', coalesce(v_request.status, null),
    'verification_reason', coalesce(v_request.decision_reason, null),
    'verification_created_at', coalesce(v_request.created_at, null),
    'verification_reviewed_at', coalesce(v_request.reviewed_at, null)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_homeschool_teacher_onboarding(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_public_teacher_onboarding(uuid, text, text, text) TO authenticated, service_role;
