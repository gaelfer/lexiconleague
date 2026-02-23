-- Enable classroom reports and add student class join flow

-- Enable classroom_reports_v1
UPDATE public.classroom_feature_flags
SET enabled = true, updated_at = now()
WHERE key = 'classroom_reports_v1';

-- Add class_join_code to classes (for students to join)
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS join_code text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_classes_join_code ON public.classes(join_code) WHERE join_code IS NOT NULL;

-- Generate join codes for existing classes (6-char alphanumeric)
CREATE OR REPLACE FUNCTION public.gen_class_join_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
  attempts int := 0;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    IF NOT EXISTS (SELECT 1 FROM public.classes WHERE join_code = result) THEN
      RETURN result;
    END IF;
    attempts := attempts + 1;
    IF attempts > 10 THEN
      RETURN result || substr(gen_random_uuid()::text, 1, 2);
    END IF;
  END LOOP;
END;
$$;

-- Backfill join codes for existing classes
UPDATE public.classes
SET join_code = public.gen_class_join_code()
WHERE join_code IS NULL;

-- Update list_teacher_classes to include join_code
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
          'join_code', c.join_code,
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

-- Trigger to auto-set join_code on new classes
CREATE OR REPLACE FUNCTION public.set_class_join_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := public.gen_class_join_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_class_join_code ON public.classes;
CREATE TRIGGER trg_set_class_join_code
  BEFORE INSERT ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.set_class_join_code();

-- Student joins a class with code
CREATE OR REPLACE FUNCTION public.join_class_as_student(
  p_join_code text,
  p_display_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_class public.classes%ROWTYPE;
  v_display_name text;
  v_username text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sign in to join a class');
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

  v_display_name := nullif(trim(coalesce(p_display_name, '')), '');
  IF v_display_name IS NULL THEN
    SELECT coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1))
    INTO v_username FROM auth.users WHERE id = v_uid;
    v_display_name := coalesce(v_username, 'Student');
  END IF;

  -- Try to claim an existing roster entry (teacher added by name, no linked user yet)
  UPDATE public.class_roster_students
  SET linked_user_id = v_uid
  WHERE class_id = v_class.id
    AND linked_user_id IS NULL
    AND lower(display_name) = lower(v_display_name)
    AND coalesce(student_identifier, '') = '';

  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'class_id', v_class.id);
  END IF;

  -- Insert new roster entry
  BEGIN
    INSERT INTO public.class_roster_students (class_id, display_name, linked_user_id)
    VALUES (v_class.id, v_display_name, v_uid);
    RETURN jsonb_build_object('success', true, 'class_id', v_class.id);
  EXCEPTION
    WHEN unique_violation THEN
      RETURN jsonb_build_object('success', false, 'error', 'Display name already taken in this class');
  END;
END;
$$;

-- List classes the current user is in (as student)
CREATE OR REPLACE FUNCTION public.list_student_classes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', true, 'rows', '[]'::jsonb);
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
          'teacher_name', p.raw_user_meta_data->>'name',
          'roster_count', (SELECT count(*)::int FROM public.class_roster_students r WHERE r.class_id = c.id)
        )
      )
      FROM public.classes c
      JOIN public.class_roster_students r ON r.class_id = c.id AND r.linked_user_id = v_uid
      LEFT JOIN auth.users p ON p.id = c.teacher_user_id
      WHERE c.archived = false
    ), '[]'::jsonb)
  );
END;
$$;

-- List classmates in a class (for a student in that class)
CREATE OR REPLACE FUNCTION public.list_classmates(
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
    SELECT 1 FROM public.class_roster_students
    WHERE class_id = p_class_id AND linked_user_id = v_uid
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not in this class');
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
          'avatar_config', (SELECT avatar_config FROM public.profiles WHERE id = r.linked_user_id)
        )
        ORDER BY r.display_name
      )
      FROM public.class_roster_students r
      WHERE r.class_id = p_class_id
    ), '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_class_as_student(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_student_classes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_classmates(uuid) TO authenticated;
