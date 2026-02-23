-- Teacher Portal V1: teacher accounts, school verification, classes, and rosters.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add teacher fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'student' CHECK (account_type IN ('student', 'teacher')),
  ADD COLUMN IF NOT EXISTS teacher_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS teacher_school_id uuid,
  ADD COLUMN IF NOT EXISTS teacher_verified_at timestamptz;

-- Schools catalog (US-first)
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  state text,
  country text NOT NULL DEFAULT 'US',
  normalized_name text NOT NULL,
  verified_domains text[] NOT NULL DEFAULT '{}'::text[],
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schools_normalized_name ON public.schools(normalized_name);
CREATE INDEX IF NOT EXISTS idx_schools_active ON public.schools(active);

-- Teacher verification request queue
CREATE TABLE IF NOT EXISTS public.teacher_verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE RESTRICT,
  school_email text NOT NULL,
  email_domain text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','approved','rejected','auto_approved')),
  decision_reason text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, school_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_verification_requests_status ON public.teacher_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_teacher_verification_requests_created_at ON public.teacher_verification_requests(created_at DESC);

-- Classes
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  name text NOT NULL,
  grade_label text,
  subject text,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classes_teacher_user_id ON public.classes(teacher_user_id);
CREATE INDEX IF NOT EXISTS idx_classes_archived ON public.classes(archived);

-- Class roster entries (can be unlinked to app users)
CREATE TABLE IF NOT EXISTS public.class_roster_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  student_identifier text,
  linked_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_roster_students_class_id ON public.class_roster_students(class_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_roster_students_unique_name_identifier
  ON public.class_roster_students (
    class_id,
    lower(display_name),
    coalesce(student_identifier, '')
  );

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_teacher_school_id_fkey;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_teacher_school_id_fkey
  FOREIGN KEY (teacher_school_id) REFERENCES public.schools(id) ON DELETE SET NULL;

-- keep updated_at maintained
DROP TRIGGER IF EXISTS trg_schools_updated_at ON public.schools;
CREATE TRIGGER trg_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.bump_updated_at();

DROP TRIGGER IF EXISTS trg_teacher_verification_requests_updated_at ON public.teacher_verification_requests;
CREATE TRIGGER trg_teacher_verification_requests_updated_at
BEFORE UPDATE ON public.teacher_verification_requests
FOR EACH ROW EXECUTE FUNCTION public.bump_updated_at();

DROP TRIGGER IF EXISTS trg_classes_updated_at ON public.classes;
CREATE TRIGGER trg_classes_updated_at
BEFORE UPDATE ON public.classes
FOR EACH ROW EXECUTE FUNCTION public.bump_updated_at();

DROP TRIGGER IF EXISTS trg_class_roster_students_updated_at ON public.class_roster_students;
CREATE TRIGGER trg_class_roster_students_updated_at
BEFORE UPDATE ON public.class_roster_students
FOR EACH ROW EXECUTE FUNCTION public.bump_updated_at();

-- Feature flag for rollout (enabled by default)
INSERT INTO public.classroom_feature_flags (key, enabled, rollout_percent)
VALUES ('teacher_portal_v1', true, 100)
ON CONFLICT (key) DO UPDATE SET enabled = true;

-- Seed minimal school list (replace/extend as needed)
INSERT INTO public.schools (name, city, state, normalized_name, verified_domains)
VALUES
  ('Lincoln High School', 'San Diego', 'CA', 'lincoln high school', ARRAY['lincolnhs.edu', 'sandiego.k12.ca.us']),
  ('Roosevelt Middle School', 'Austin', 'TX', 'roosevelt middle school', ARRAY['rooseveltms.org', 'austinisd.org']),
  ('Jefferson Elementary', 'Orlando', 'FL', 'jefferson elementary', ARRAY['jeffersonelem.net', 'ocps.net'])
ON CONFLICT DO NOTHING;

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_roster_students ENABLE ROW LEVEL SECURITY;

-- Schools are searchable by signed-in users during teacher signup.
DROP POLICY IF EXISTS "Authenticated users can search schools" ON public.schools;
CREATE POLICY "Authenticated users can search schools"
  ON public.schools FOR SELECT
  USING (auth.uid() IS NOT NULL AND active = true);

-- Verification requests are private to owner (or service role)
DROP POLICY IF EXISTS "Teacher verification own rows" ON public.teacher_verification_requests;
CREATE POLICY "Teacher verification own rows"
  ON public.teacher_verification_requests FOR SELECT
  USING (auth.uid() = user_id OR (auth.jwt() ->> 'role') = 'service_role');

-- class and roster direct access only for owner
DROP POLICY IF EXISTS "Teachers can read own classes" ON public.classes;
CREATE POLICY "Teachers can read own classes"
  ON public.classes FOR SELECT
  USING (auth.uid() = teacher_user_id);

DROP POLICY IF EXISTS "Teachers can insert own classes" ON public.classes;
CREATE POLICY "Teachers can insert own classes"
  ON public.classes FOR INSERT
  WITH CHECK (auth.uid() = teacher_user_id);

DROP POLICY IF EXISTS "Teachers can update own classes" ON public.classes;
CREATE POLICY "Teachers can update own classes"
  ON public.classes FOR UPDATE
  USING (auth.uid() = teacher_user_id)
  WITH CHECK (auth.uid() = teacher_user_id);

DROP POLICY IF EXISTS "Teachers can read own roster" ON public.class_roster_students;
CREATE POLICY "Teachers can read own roster"
  ON public.class_roster_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = class_roster_students.class_id
        AND c.teacher_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Teachers can mutate own roster" ON public.class_roster_students;
CREATE POLICY "Teachers can mutate own roster"
  ON public.class_roster_students FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = class_roster_students.class_id
        AND c.teacher_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = class_roster_students.class_id
        AND c.teacher_user_id = auth.uid()
    )
  );

-- ── RPCs ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.search_schools(
  p_query text,
  p_limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_q text := lower(trim(coalesce(p_query, '')));
  v_lim integer := LEAST(GREATEST(coalesce(p_limit, 10), 1), 50);
BEGIN
  RETURN jsonb_build_object(
    'success', true,
    'rows', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'name', s.name,
          'city', s.city,
          'state', s.state,
          'country', s.country
        )
      )
      FROM (
        SELECT *
        FROM public.schools
        WHERE active = true
          AND (
            v_q = ''
            OR normalized_name ILIKE '%' || v_q || '%'
            OR lower(name) ILIKE '%' || v_q || '%'
            OR lower(coalesce(city,'')) ILIKE '%' || v_q || '%'
            OR lower(coalesce(state,'')) ILIKE '%' || v_q || '%'
          )
        ORDER BY name
        LIMIT v_lim
      ) s
    ), '[]'::jsonb)
  );
END;
$$;

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

  UPDATE public.profiles
  SET
    account_type = 'teacher',
    teacher_school_id = v_school.id,
    teacher_approved = v_approved,
    teacher_verified_at = CASE WHEN v_approved THEN coalesce(teacher_verified_at, now()) ELSE NULL END,
    updated_at = now()
  WHERE id = v_uid;

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

  SELECT id, account_type, teacher_approved, teacher_school_id, teacher_verified_at
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
    'verification_status', coalesce(v_request.status, null),
    'verification_reason', coalesce(v_request.decision_reason, null),
    'verification_created_at', coalesce(v_request.created_at, null),
    'verification_reviewed_at', coalesce(v_request.reviewed_at, null)
  );
END;
$$;

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
  v_class public.classes%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT account_type, teacher_approved, teacher_school_id
  INTO v_profile
  FROM public.profiles
  WHERE id = v_uid;

  IF coalesce(v_profile.account_type, 'student') <> 'teacher' OR coalesce(v_profile.teacher_approved, false) = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Teacher approval required');
  END IF;

  INSERT INTO public.classes (teacher_user_id, school_id, name, grade_label, subject)
  VALUES (
    v_uid,
    coalesce(p_school_id, v_profile.teacher_school_id),
    nullif(trim(p_name), ''),
    nullif(trim(p_grade_label), ''),
    nullif(trim(p_subject), '')
  )
  RETURNING * INTO v_class;

  RETURN jsonb_build_object('success', true, 'class_id', v_class.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_class(
  p_class_id uuid,
  p_name text,
  p_grade_label text DEFAULT NULL,
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

  UPDATE public.classes
  SET
    name = nullif(trim(p_name), ''),
    grade_label = nullif(trim(p_grade_label), ''),
    subject = nullif(trim(p_subject), ''),
    updated_at = now()
  WHERE id = p_class_id
    AND teacher_user_id = v_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Class not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_class(
  p_class_id uuid,
  p_archived boolean DEFAULT true
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

  UPDATE public.classes
  SET archived = coalesce(p_archived, true), updated_at = now()
  WHERE id = p_class_id
    AND teacher_user_id = v_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Class not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_teacher_classes()
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

  RETURN jsonb_build_object(
    'success', true,
    'rows', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'grade_label', c.grade_label,
          'subject', c.subject,
          'archived', c.archived,
          'created_at', c.created_at,
          'updated_at', c.updated_at,
          'roster_count', (
            SELECT count(*)::int
            FROM public.class_roster_students r
            WHERE r.class_id = c.id
          )
        )
        ORDER BY c.updated_at DESC
      )
      FROM public.classes c
      WHERE c.teacher_user_id = v_uid
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.add_roster_student(
  p_class_id uuid,
  p_display_name text,
  p_student_identifier text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.class_roster_students%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.classes c WHERE c.id = p_class_id AND c.teacher_user_id = v_uid
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Class not found');
  END IF;

  INSERT INTO public.class_roster_students (class_id, display_name, student_identifier, notes)
  VALUES (
    p_class_id,
    nullif(trim(p_display_name), ''),
    nullif(trim(p_student_identifier), ''),
    nullif(trim(p_notes), '')
  )
  RETURNING * INTO v_row;

  RETURN jsonb_build_object('success', true, 'id', v_row.id);
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Duplicate roster entry');
END;
$$;

CREATE OR REPLACE FUNCTION public.import_roster_csv(
  p_class_id uuid,
  p_rows jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row jsonb;
  v_name text;
  v_identifier text;
  v_notes text;
  v_inserted integer := 0;
  v_skipped integer := 0;
  v_errors jsonb := '[]'::jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.classes c WHERE c.id = p_class_id AND c.teacher_user_id = v_uid
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Class not found');
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) LOOP
    v_name := nullif(trim(coalesce(v_row->>'display_name', '')), '');
    v_identifier := nullif(trim(coalesce(v_row->>'student_identifier', '')), '');
    v_notes := nullif(trim(coalesce(v_row->>'notes', '')), '');

    IF v_name IS NULL THEN
      v_skipped := v_skipped + 1;
      v_errors := v_errors || jsonb_build_object('row', v_row, 'error', 'display_name is required');
      CONTINUE;
    END IF;

    BEGIN
      INSERT INTO public.class_roster_students (class_id, display_name, student_identifier, notes)
      VALUES (p_class_id, v_name, v_identifier, v_notes);
      v_inserted := v_inserted + 1;
    EXCEPTION
      WHEN unique_violation THEN
        v_skipped := v_skipped + 1;
        v_errors := v_errors || jsonb_build_object('row', v_row, 'error', 'duplicate entry');
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'inserted', v_inserted,
    'skipped', v_skipped,
    'errors', v_errors
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_class_roster(
  p_class_id uuid
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
          'display_name', r.display_name,
          'student_identifier', r.student_identifier,
          'linked_user_id', r.linked_user_id,
          'notes', r.notes,
          'created_at', r.created_at,
          'updated_at', r.updated_at
        )
        ORDER BY lower(r.display_name), r.created_at
      )
      FROM public.class_roster_students r
      WHERE r.class_id = p_class_id
    ), '[]'::jsonb)
  );
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.search_schools(text, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.start_teacher_verification(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_teacher_portal_status() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_class(text, text, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_class(uuid, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.archive_class(uuid, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_teacher_classes() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_roster_student(uuid, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.import_roster_csv(uuid, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_class_roster(uuid) TO authenticated, service_role;
