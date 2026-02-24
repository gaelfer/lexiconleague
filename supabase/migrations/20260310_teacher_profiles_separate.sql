-- Separate teacher_profiles table: teachers have their own profile database.
-- Normal (student) accounts are NOT automatically in teacher mode.
-- Teacher portal access requires: (1) teacher_profile exists, (2) teacher_mode cookie set via teacher-login.

-- 1. Create teacher_profiles table
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_approved boolean NOT NULL DEFAULT false,
  teacher_school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  teacher_verified_at timestamptz,
  teacher_type text CHECK (teacher_type IN ('homeschool', 'public')),
  teacher_grade text,
  teacher_subject text,
  teacher_onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_profiles_approved ON public.teacher_profiles(teacher_approved);

-- 2. Migrate existing teacher data from profiles
INSERT INTO public.teacher_profiles (
  user_id,
  teacher_approved,
  teacher_school_id,
  teacher_verified_at,
  teacher_type,
  teacher_grade,
  teacher_subject,
  teacher_onboarding_completed,
  updated_at
)
SELECT
  id,
  coalesce(teacher_approved, false),
  teacher_school_id,
  teacher_verified_at,
  teacher_type,
  teacher_grade,
  teacher_subject,
  coalesce(teacher_onboarding_completed, false),
  now()
FROM public.profiles
WHERE account_type = 'teacher'
ON CONFLICT (user_id) DO UPDATE SET
  teacher_approved = EXCLUDED.teacher_approved,
  teacher_school_id = EXCLUDED.teacher_school_id,
  teacher_verified_at = EXCLUDED.teacher_verified_at,
  teacher_type = EXCLUDED.teacher_type,
  teacher_grade = EXCLUDED.teacher_grade,
  teacher_subject = EXCLUDED.teacher_subject,
  teacher_onboarding_completed = EXCLUDED.teacher_onboarding_completed,
  updated_at = now();

-- 3. RLS for teacher_profiles
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own teacher profile" ON public.teacher_profiles;
CREATE POLICY "Users can read own teacher profile"
  ON public.teacher_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own teacher profile" ON public.teacher_profiles;
CREATE POLICY "Users can insert own teacher profile"
  ON public.teacher_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own teacher profile" ON public.teacher_profiles;
CREATE POLICY "Users can update own teacher profile"
  ON public.teacher_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Update get_teacher_portal_status to read from teacher_profiles
CREATE OR REPLACE FUNCTION public.get_teacher_portal_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tp record;
  v_request record;
  v_has_teacher_profile boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT teacher_approved, teacher_school_id, teacher_verified_at,
         teacher_type, teacher_grade, teacher_subject, teacher_onboarding_completed
  INTO v_tp
  FROM public.teacher_profiles
  WHERE user_id = v_uid;

  v_has_teacher_profile := FOUND;

  SELECT status, decision_reason, created_at, reviewed_at
  INTO v_request
  FROM public.teacher_verification_requests
  WHERE user_id = v_uid
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'success', true,
    'account_type', CASE WHEN v_has_teacher_profile THEN 'teacher' ELSE 'student' END,
    'teacher_approved', coalesce(v_tp.teacher_approved, false),
    'teacher_school_id', v_tp.teacher_school_id,
    'teacher_verified_at', v_tp.teacher_verified_at,
    'teacher_type', v_tp.teacher_type,
    'teacher_grade', v_tp.teacher_grade,
    'teacher_subject', v_tp.teacher_subject,
    'teacher_onboarding_completed', coalesce(v_tp.teacher_onboarding_completed, false),
    'verification_status', coalesce(v_request.status, null),
    'verification_reason', coalesce(v_request.decision_reason, null),
    'verification_created_at', coalesce(v_request.created_at, null),
    'verification_reviewed_at', coalesce(v_request.reviewed_at, null)
  );
END;
$$;

-- 5. Update complete_homeschool_teacher_onboarding to use teacher_profiles
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

  INSERT INTO public.teacher_profiles (
    user_id,
    teacher_type,
    teacher_school_id,
    teacher_approved,
    teacher_verified_at,
    teacher_grade,
    teacher_subject,
    teacher_onboarding_completed,
    updated_at
  )
  VALUES (
    v_uid,
    'homeschool',
    NULL,
    true,
    now(),
    nullif(trim(p_grade), ''),
    nullif(trim(p_subject), ''),
    true,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    teacher_type = 'homeschool',
    teacher_school_id = NULL,
    teacher_approved = true,
    teacher_verified_at = now(),
    teacher_grade = nullif(trim(p_grade), ''),
    teacher_subject = nullif(trim(p_subject), ''),
    teacher_onboarding_completed = true,
    updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 6. Update complete_public_teacher_onboarding to use teacher_profiles
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

  INSERT INTO public.teacher_profiles (
    user_id,
    teacher_type,
    teacher_grade,
    teacher_subject,
    teacher_onboarding_completed,
    updated_at
  )
  VALUES (
    v_uid,
    'public',
    nullif(trim(p_grade), ''),
    nullif(trim(p_subject), ''),
    true,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    teacher_type = 'public',
    teacher_grade = nullif(trim(p_grade), ''),
    teacher_subject = nullif(trim(p_subject), ''),
    teacher_onboarding_completed = true,
    updated_at = now();

  RETURN v_result;
END;
$$;

-- 7. Update start_teacher_verification to use teacher_profiles
CREATE OR REPLACE FUNCTION public.start_teacher_verification(
  p_school_id uuid,
  p_school_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text := lower(trim(coalesce(p_school_email, '')));
  v_domain text;
  v_school public.schools%ROWTYPE;
  v_existing_status text;
  v_existing_reason text;
  v_existing_reviewed_at timestamptz;
  v_auto boolean := false;
  v_status text;
  v_approved boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF v_email = '' OR position('@' in v_email) <= 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valid school email required');
  END IF;

  v_domain := split_part(v_email, '@', 2);

  SELECT * INTO v_school
  FROM public.schools
  WHERE id = p_school_id
    AND active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'School not found');
  END IF;

  v_auto := lower(v_domain) = ANY (
    SELECT lower(value) FROM unnest(v_school.verified_domains) AS value
  );

  SELECT status, decision_reason, reviewed_at
  INTO v_existing_status, v_existing_reason, v_existing_reviewed_at
  FROM public.teacher_verification_requests
  WHERE user_id = v_uid
    AND school_id = v_school.id
  LIMIT 1;

  IF FOUND AND v_existing_status IN ('approved', 'auto_approved') THEN
    v_status := v_existing_status;
    v_approved := true;
  ELSIF FOUND AND v_existing_status = 'rejected' THEN
    v_status := 'rejected';
    v_approved := false;
  ELSE
    v_status := CASE WHEN v_auto THEN 'auto_approved' ELSE 'pending' END;
    v_approved := v_auto;
  END IF;

  INSERT INTO public.teacher_verification_requests (
    user_id,
    school_id,
    school_email,
    email_domain,
    status,
    decision_reason,
    reviewed_at
  )
  VALUES (
    v_uid,
    v_school.id,
    v_email,
    v_domain,
    v_status,
    CASE
      WHEN v_status = 'auto_approved' THEN 'Matched verified school domain'
      WHEN v_status = 'pending' THEN 'Awaiting manual review'
      WHEN v_status = 'rejected' THEN coalesce(v_existing_reason, 'Rejected by reviewer')
      ELSE coalesce(v_existing_reason, 'Approved by reviewer')
    END,
    CASE WHEN v_status IN ('auto_approved', 'approved') THEN coalesce(v_existing_reviewed_at, now()) ELSE v_existing_reviewed_at END
  )
  ON CONFLICT (user_id, school_id)
  DO UPDATE SET
    school_email = EXCLUDED.school_email,
    email_domain = EXCLUDED.email_domain,
    status = CASE
      WHEN teacher_verification_requests.status IN ('approved', 'rejected') THEN teacher_verification_requests.status
      ELSE EXCLUDED.status
    END,
    decision_reason = CASE
      WHEN teacher_verification_requests.status IN ('approved', 'rejected') THEN teacher_verification_requests.decision_reason
      ELSE EXCLUDED.decision_reason
    END,
    reviewed_at = CASE
      WHEN teacher_verification_requests.status IN ('approved', 'rejected') THEN teacher_verification_requests.reviewed_at
      ELSE EXCLUDED.reviewed_at
    END,
    updated_at = now();

  INSERT INTO public.teacher_profiles (
    user_id,
    teacher_school_id,
    teacher_approved,
    teacher_verified_at,
    updated_at
  )
  VALUES (
    v_uid,
    v_school.id,
    v_approved,
    CASE WHEN v_approved THEN now() ELSE NULL END,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    teacher_school_id = v_school.id,
    teacher_approved = v_approved,
    teacher_verified_at = CASE WHEN v_approved THEN coalesce(teacher_profiles.teacher_verified_at, now()) ELSE NULL END,
    updated_at = now();

  PERFORM public.log_app_event(
    CASE
      WHEN v_status = 'auto_approved' THEN 'teacher_verification_auto_approved'
      WHEN v_status = 'rejected' THEN 'teacher_verification_rejected'
      WHEN v_status = 'approved' THEN 'teacher_verification_approved'
      ELSE 'teacher_verification_pending'
    END,
    v_uid,
    NULL,
    jsonb_build_object('school_id', v_school.id, 'domain', v_domain, 'status', v_status)
  );

  RETURN jsonb_build_object(
    'success', true,
    'status', v_status,
    'teacher_approved', v_approved
  );
END;
$$;

-- 8. Update create_class to check teacher_profiles
CREATE OR REPLACE FUNCTION public.create_class(
  p_name text,
  p_grade_label text DEFAULT NULL,
  p_subject text DEFAULT NULL,
  p_school_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile record;
  v_class_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT teacher_approved, teacher_school_id
  INTO v_profile
  FROM public.teacher_profiles
  WHERE user_id = v_uid;

  IF coalesce(v_profile.teacher_approved, false) = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Teacher approval required');
  END IF;

  INSERT INTO public.classes (teacher_user_id, school_id, name, grade_label, subject)
  VALUES (
    v_uid,
    coalesce(p_school_id, v_profile.teacher_school_id),
    trim(p_name),
    nullif(trim(p_grade_label), ''),
    nullif(trim(p_subject), '')
  )
  RETURNING id INTO v_class_id;

  RETURN jsonb_build_object('success', true, 'class_id', v_class_id);
END;
$$;
