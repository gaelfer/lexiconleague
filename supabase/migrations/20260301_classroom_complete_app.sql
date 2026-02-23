-- Lexicon League classroom reliability + reporting foundation

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Feature flags ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.classroom_feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  rollout_percent integer NOT NULL DEFAULT 100 CHECK (rollout_percent >= 0 AND rollout_percent <= 100),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.classroom_feature_flags (key, enabled, rollout_percent)
VALUES
  ('classroom_persistence_v1', false, 100),
  ('classroom_reports_v1', false, 100),
  ('classroom_access_code_v1', false, 100)
ON CONFLICT (key) DO NOTHING;

-- ── Core tables ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.classroom_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL UNIQUE,
  teacher_code_hash text NOT NULL,
  teacher_access_token text,
  teacher_token_expires_at timestamptz,
  host_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  locked boolean NOT NULL DEFAULT false,
  max_players integer NOT NULL DEFAULT 30 CHECK (max_players BETWEEN 2 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classroom_rooms_status ON public.classroom_rooms(status);
CREATE INDEX IF NOT EXISTS idx_classroom_rooms_updated_at ON public.classroom_rooms(updated_at DESC);

CREATE TABLE IF NOT EXISTS public.classroom_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.classroom_rooms(id) ON DELETE CASCADE,
  seed text NOT NULL,
  subject text NOT NULL CHECK (subject IN ('vocabulary', 'punctuation')),
  vocab_level text,
  punctuation_level integer,
  host_plays boolean NOT NULL DEFAULT true,
  allow_late_join boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'aborted')),
  ended_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, seed)
);

CREATE INDEX IF NOT EXISTS idx_classroom_sessions_room_status ON public.classroom_sessions(room_id, status);
CREATE INDEX IF NOT EXISTS idx_classroom_sessions_started_at ON public.classroom_sessions(started_at DESC);

CREATE TABLE IF NOT EXISTS public.classroom_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.classroom_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_id text,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('host', 'student')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  was_kicked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id),
  UNIQUE (session_id, guest_id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_participants_session ON public.classroom_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_classroom_participants_guest ON public.classroom_participants(guest_id);

CREATE TABLE IF NOT EXISTS public.classroom_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.classroom_sessions(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.classroom_participants(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  correct integer NOT NULL DEFAULT 0,
  incorrect integer NOT NULL DEFAULT 0,
  accuracy integer NOT NULL DEFAULT 0,
  finished_at timestamptz NOT NULL DEFAULT now(),
  skill_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_results_session_score ON public.classroom_results(session_id, score DESC, accuracy DESC, finished_at ASC);

CREATE TABLE IF NOT EXISTS public.app_events (
  id bigserial PRIMARY KEY,
  event_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id uuid REFERENCES public.classroom_sessions(id) ON DELETE SET NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_events_event_created ON public.app_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_events_session ON public.app_events(session_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.classroom_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read classroom feature flags" ON public.classroom_feature_flags;
CREATE POLICY "Anyone can read classroom feature flags"
  ON public.classroom_feature_flags FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role can manage classroom feature flags" ON public.classroom_feature_flags;
CREATE POLICY "Service role can manage classroom feature flags"
  ON public.classroom_feature_flags FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- Room/session/result tables are accessed through SECURITY DEFINER RPCs.
DROP POLICY IF EXISTS "No direct room reads" ON public.classroom_rooms;
CREATE POLICY "No direct room reads"
  ON public.classroom_rooms FOR SELECT
  USING (false);

DROP POLICY IF EXISTS "No direct session reads" ON public.classroom_sessions;
CREATE POLICY "No direct session reads"
  ON public.classroom_sessions FOR SELECT
  USING (false);

DROP POLICY IF EXISTS "No direct participant reads" ON public.classroom_participants;
CREATE POLICY "No direct participant reads"
  ON public.classroom_participants FOR SELECT
  USING (false);

DROP POLICY IF EXISTS "No direct result reads" ON public.classroom_results;
CREATE POLICY "No direct result reads"
  ON public.classroom_results FOR SELECT
  USING (false);

DROP POLICY IF EXISTS "No direct app events" ON public.app_events;
CREATE POLICY "No direct app events"
  ON public.app_events FOR SELECT
  USING (false);

-- ── Helpers ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.bump_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_classroom_rooms_updated_at ON public.classroom_rooms;
CREATE TRIGGER trg_classroom_rooms_updated_at
BEFORE UPDATE ON public.classroom_rooms
FOR EACH ROW EXECUTE FUNCTION public.bump_updated_at();

DROP TRIGGER IF EXISTS trg_classroom_sessions_updated_at ON public.classroom_sessions;
CREATE TRIGGER trg_classroom_sessions_updated_at
BEFORE UPDATE ON public.classroom_sessions
FOR EACH ROW EXECUTE FUNCTION public.bump_updated_at();

DROP TRIGGER IF EXISTS trg_classroom_participants_updated_at ON public.classroom_participants;
CREATE TRIGGER trg_classroom_participants_updated_at
BEFORE UPDATE ON public.classroom_participants
FOR EACH ROW EXECUTE FUNCTION public.bump_updated_at();

DROP TRIGGER IF EXISTS trg_classroom_results_updated_at ON public.classroom_results;
CREATE TRIGGER trg_classroom_results_updated_at
BEFORE UPDATE ON public.classroom_results
FOR EACH ROW EXECUTE FUNCTION public.bump_updated_at();

CREATE OR REPLACE FUNCTION public.is_feature_enabled(
  p_key text,
  p_default boolean DEFAULT false
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((
    SELECT enabled
    FROM public.classroom_feature_flags
    WHERE key = p_key
  ), p_default);
$$;

CREATE OR REPLACE FUNCTION public.log_app_event(
  p_event_name text,
  p_user_id uuid DEFAULT NULL,
  p_session_id uuid DEFAULT NULL,
  p_properties jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_events(event_name, user_id, session_id, properties)
  VALUES (p_event_name, p_user_id, p_session_id, COALESCE(p_properties, '{}'::jsonb));
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_teacher_access(
  p_room_id uuid,
  p_teacher_token text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.classroom_rooms%ROWTYPE;
BEGIN
  SELECT * INTO v_room
  FROM public.classroom_rooms
  WHERE id = p_room_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF auth.uid() IS NOT NULL AND v_room.host_user_id = auth.uid() THEN
    RETURN true;
  END IF;

  IF p_teacher_token IS NOT NULL
     AND v_room.teacher_access_token IS NOT NULL
     AND v_room.teacher_access_token = p_teacher_token
     AND (v_room.teacher_token_expires_at IS NULL OR v_room.teacher_token_expires_at > now()) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- ── RPCs ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_classroom_room(
  p_room_code text,
  p_teacher_code_plain text,
  p_max_players integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text := upper(trim(p_room_code));
  v_teacher_code text := trim(p_teacher_code_plain);
  v_room public.classroom_rooms%ROWTYPE;
BEGIN
  IF length(v_code) <> 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room code must be 6 characters');
  END IF;

  IF v_teacher_code IS NULL OR length(v_teacher_code) < 4 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Teacher code must be at least 4 characters');
  END IF;

  INSERT INTO public.classroom_rooms(room_code, teacher_code_hash, host_user_id, max_players)
  VALUES (
    v_code,
    crypt(v_teacher_code, gen_salt('bf')),
    auth.uid(),
    LEAST(GREATEST(COALESCE(p_max_players, 30), 2), 100)
  )
  ON CONFLICT (room_code)
  DO UPDATE SET
    teacher_code_hash = EXCLUDED.teacher_code_hash,
    host_user_id = EXCLUDED.host_user_id,
    status = 'active',
    locked = false,
    max_players = EXCLUDED.max_players,
    teacher_access_token = NULL,
    teacher_token_expires_at = NULL,
    updated_at = now()
  RETURNING * INTO v_room;

  PERFORM public.log_app_event('classroom_room_created', auth.uid(), NULL, jsonb_build_object('room_code', v_room.room_code));

  RETURN jsonb_build_object(
    'success', true,
    'room_id', v_room.id,
    'room_code', v_room.room_code,
    'max_players', v_room.max_players
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_teacher_access(
  p_room_code text,
  p_teacher_code_plain text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.classroom_rooms%ROWTYPE;
  v_token text;
BEGIN
  SELECT * INTO v_room
  FROM public.classroom_rooms
  WHERE room_code = upper(trim(p_room_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room not found');
  END IF;

  IF crypt(trim(p_teacher_code_plain), v_room.teacher_code_hash) <> v_room.teacher_code_hash THEN
    PERFORM public.log_app_event('classroom_teacher_access_failed', auth.uid(), NULL, jsonb_build_object('room_code', v_room.room_code));
    RETURN jsonb_build_object('success', false, 'error', 'Invalid teacher code');
  END IF;

  v_token := encode(gen_random_bytes(24), 'hex');

  UPDATE public.classroom_rooms
  SET teacher_access_token = v_token,
      teacher_token_expires_at = now() + interval '8 hours',
      updated_at = now()
  WHERE id = v_room.id;

  PERFORM public.log_app_event('classroom_teacher_access_granted', auth.uid(), NULL, jsonb_build_object('room_code', v_room.room_code));

  RETURN jsonb_build_object(
    'success', true,
    'room_id', v_room.id,
    'room_code', v_room.room_code,
    'teacher_token', v_token,
    'expires_at', (now() + interval '8 hours')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_classroom_join(
  p_room_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.classroom_rooms%ROWTYPE;
  v_running public.classroom_sessions%ROWTYPE;
  v_players integer := 0;
BEGIN
  SELECT * INTO v_room
  FROM public.classroom_rooms
  WHERE room_code = upper(trim(p_room_code))
  LIMIT 1;

  IF NOT FOUND OR v_room.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room not found');
  END IF;

  IF v_room.locked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room is locked');
  END IF;

  SELECT * INTO v_running
  FROM public.classroom_sessions
  WHERE room_id = v_room.id AND status = 'running'
  ORDER BY started_at DESC
  LIMIT 1;

  IF FOUND AND NOT v_running.allow_late_join THEN
    RETURN jsonb_build_object('success', false, 'error', 'Round already in progress');
  END IF;

  SELECT COUNT(*) INTO v_players
  FROM (
    SELECT DISTINCT key
    FROM realtime.presences
    WHERE topic = 'classroom:' || v_room.room_code
  ) t;

  -- fallback: if realtime metadata unavailable, allow join and client presence cap still applies
  IF v_players IS NOT NULL AND v_players >= v_room.max_players THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room is full');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'room_id', v_room.id,
    'room_code', v_room.room_code,
    'max_players', v_room.max_players,
    'locked', v_room.locked
  );
EXCEPTION
  WHEN undefined_table THEN
    RETURN jsonb_build_object(
      'success', true,
      'room_id', v_room.id,
      'room_code', v_room.room_code,
      'max_players', v_room.max_players,
      'locked', v_room.locked
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.start_classroom_session(
  p_room_code text,
  p_seed text,
  p_config_json jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.classroom_rooms%ROWTYPE;
  v_session public.classroom_sessions%ROWTYPE;
  v_teacher_token text := NULLIF(trim(COALESCE(p_config_json->>'teacherToken', '')), '');
BEGIN
  SELECT * INTO v_room
  FROM public.classroom_rooms
  WHERE room_code = upper(trim(p_room_code))
  LIMIT 1;

  IF NOT FOUND OR v_room.status <> 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room not found');
  END IF;

  IF NOT public.assert_teacher_access(v_room.id, v_teacher_token) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Teacher access required');
  END IF;

  INSERT INTO public.classroom_sessions(
    room_id,
    seed,
    subject,
    vocab_level,
    punctuation_level,
    host_plays,
    allow_late_join,
    started_at,
    status
  ) VALUES (
    v_room.id,
    p_seed,
    COALESCE(p_config_json->>'subject', 'vocabulary'),
    NULLIF(p_config_json->>'vocabLevel', ''),
    NULLIF(p_config_json->>'punctuationLevel', '')::integer,
    COALESCE((p_config_json->>'hostPlays')::boolean, true),
    COALESCE((p_config_json->>'allowLateJoin')::boolean, false),
    COALESCE((p_config_json->>'startedAt')::timestamptz, now()),
    'running'
  )
  ON CONFLICT (room_id, seed)
  DO UPDATE SET
    subject = EXCLUDED.subject,
    vocab_level = EXCLUDED.vocab_level,
    punctuation_level = EXCLUDED.punctuation_level,
    host_plays = EXCLUDED.host_plays,
    allow_late_join = EXCLUDED.allow_late_join,
    started_at = EXCLUDED.started_at,
    status = 'running',
    ended_at = NULL,
    ended_reason = NULL,
    updated_at = now()
  RETURNING * INTO v_session;

  PERFORM public.log_app_event('classroom_session_started', auth.uid(), v_session.id, jsonb_build_object('room_code', v_room.room_code, 'seed', p_seed));

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session.id,
    'room_id', v_room.id,
    'seed', v_session.seed,
    'started_at', v_session.started_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_classroom_result(
  p_session_id uuid,
  p_participant_key text,
  p_result_json jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.classroom_sessions%ROWTYPE;
  v_participant public.classroom_participants%ROWTYPE;
  v_role text := CASE WHEN lower(COALESCE(p_result_json->>'role', 'student')) = 'host' THEN 'host' ELSE 'student' END;
  v_user_id uuid := NULLIF(COALESCE(p_result_json->>'userId', ''), '')::uuid;
  v_guest_id text := NULLIF(trim(COALESCE(p_participant_key, '')), '');
  v_display_name text := COALESCE(NULLIF(trim(p_result_json->>'username'), ''), 'Player');
BEGIN
  SELECT * INTO v_session
  FROM public.classroom_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  IF v_guest_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Participant key required');
  END IF;

  INSERT INTO public.classroom_participants(
    session_id,
    user_id,
    guest_id,
    display_name,
    role,
    joined_at
  )
  VALUES (
    v_session.id,
    v_user_id,
    v_guest_id,
    v_display_name,
    v_role,
    now()
  )
  ON CONFLICT (session_id, guest_id)
  DO UPDATE SET
    user_id = COALESCE(EXCLUDED.user_id, public.classroom_participants.user_id),
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    updated_at = now()
  RETURNING * INTO v_participant;

  INSERT INTO public.classroom_results(
    session_id,
    participant_id,
    score,
    correct,
    incorrect,
    accuracy,
    finished_at,
    skill_breakdown
  )
  VALUES (
    v_session.id,
    v_participant.id,
    COALESCE((p_result_json->>'score')::integer, 0),
    COALESCE((p_result_json->>'correct')::integer, 0),
    COALESCE((p_result_json->>'incorrect')::integer, 0),
    COALESCE((p_result_json->>'accuracy')::integer, 0),
    COALESCE((p_result_json->>'finishedAt')::timestamptz, now()),
    COALESCE(p_result_json->'skillBreakdown', '{}'::jsonb)
  )
  ON CONFLICT (session_id, participant_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    correct = EXCLUDED.correct,
    incorrect = EXCLUDED.incorrect,
    accuracy = EXCLUDED.accuracy,
    finished_at = EXCLUDED.finished_at,
    skill_breakdown = EXCLUDED.skill_breakdown,
    updated_at = now();

  PERFORM public.log_app_event('classroom_result_submitted', v_user_id, v_session.id, jsonb_build_object('participant_key', v_guest_id));

  RETURN jsonb_build_object('success', true, 'participant_id', v_participant.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.finalize_classroom_session(
  p_session_id uuid,
  p_ended_reason text,
  p_teacher_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.classroom_sessions%ROWTYPE;
  v_room public.classroom_rooms%ROWTYPE;
BEGIN
  SELECT * INTO v_session
  FROM public.classroom_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  SELECT * INTO v_room FROM public.classroom_rooms WHERE id = v_session.room_id;

  IF NOT public.assert_teacher_access(v_room.id, p_teacher_token) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Teacher access required');
  END IF;

  UPDATE public.classroom_sessions
  SET
    status = CASE WHEN COALESCE(trim(p_ended_reason), '') = 'completed' THEN 'completed' ELSE 'aborted' END,
    ended_reason = COALESCE(NULLIF(trim(p_ended_reason), ''), 'aborted'),
    ended_at = COALESCE(ended_at, now()),
    updated_at = now()
  WHERE id = p_session_id;

  PERFORM public.log_app_event('classroom_session_finalized', auth.uid(), p_session_id, jsonb_build_object('ended_reason', p_ended_reason));

  RETURN jsonb_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_classroom_report(
  p_session_id uuid,
  p_teacher_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.classroom_sessions%ROWTYPE;
  v_room public.classroom_rooms%ROWTYPE;
BEGIN
  SELECT * INTO v_session
  FROM public.classroom_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found');
  END IF;

  SELECT * INTO v_room
  FROM public.classroom_rooms
  WHERE id = v_session.room_id;

  IF NOT public.assert_teacher_access(v_room.id, p_teacher_token) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Teacher access required');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'session', jsonb_build_object(
      'id', v_session.id,
      'room_code', v_room.room_code,
      'subject', v_session.subject,
      'vocab_level', v_session.vocab_level,
      'punctuation_level', v_session.punctuation_level,
      'host_plays', v_session.host_plays,
      'started_at', v_session.started_at,
      'ended_at', v_session.ended_at,
      'status', v_session.status,
      'ended_reason', v_session.ended_reason
    ),
    'rows', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'participant_id', p.id,
          'display_name', p.display_name,
          'role', p.role,
          'joined_at', p.joined_at,
          'left_at', p.left_at,
          'was_kicked', p.was_kicked,
          'score', r.score,
          'correct', r.correct,
          'incorrect', r.incorrect,
          'accuracy', r.accuracy,
          'finished_at', r.finished_at,
          'skill_breakdown', r.skill_breakdown
        )
        ORDER BY r.score DESC, r.accuracy DESC, r.finished_at ASC
      )
      FROM public.classroom_participants p
      LEFT JOIN public.classroom_results r
        ON r.participant_id = p.id AND r.session_id = p.session_id
      WHERE p.session_id = v_session.id
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.export_classroom_report_csv(
  p_session_id uuid,
  p_teacher_token text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report jsonb;
  v_row jsonb;
  v_csv text := 'rank,display_name,role,score,correct,incorrect,accuracy,finished_at,joined_at,left_at,was_kicked,skill_breakdown' || E'\n';
  v_rank integer := 0;
BEGIN
  v_report := public.get_classroom_report(p_session_id, p_teacher_token);

  IF COALESCE((v_report->>'success')::boolean, false) = false THEN
    RETURN '';
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(COALESCE(v_report->'rows', '[]'::jsonb)) LOOP
    v_rank := v_rank + 1;
    v_csv := v_csv ||
      v_rank::text || ',' ||
      quote_literal(COALESCE(v_row->>'display_name', '')) || ',' ||
      quote_literal(COALESCE(v_row->>'role', 'student')) || ',' ||
      COALESCE(v_row->>'score', '0') || ',' ||
      COALESCE(v_row->>'correct', '0') || ',' ||
      COALESCE(v_row->>'incorrect', '0') || ',' ||
      COALESCE(v_row->>'accuracy', '0') || ',' ||
      quote_literal(COALESCE(v_row->>'finished_at', '')) || ',' ||
      quote_literal(COALESCE(v_row->>'joined_at', '')) || ',' ||
      quote_literal(COALESCE(v_row->>'left_at', '')) || ',' ||
      COALESCE(v_row->>'was_kicked', 'false') || ',' ||
      quote_literal(COALESCE((v_row->'skill_breakdown')::text, '{}')) ||
      E'\n';
  END LOOP;

  RETURN v_csv;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_classroom_reports(
  p_room_code text DEFAULT NULL,
  p_subject text DEFAULT NULL,
  p_days integer DEFAULT 30,
  p_teacher_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days integer := LEAST(GREATEST(COALESCE(p_days, 30), 1), 365);
BEGIN
  RETURN jsonb_build_object(
    'success', true,
    'rows', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'session_id', s.id,
          'room_code', r.room_code,
          'subject', s.subject,
          'vocab_level', s.vocab_level,
          'punctuation_level', s.punctuation_level,
          'status', s.status,
          'started_at', s.started_at,
          'ended_at', s.ended_at,
          'participants', (
            SELECT COUNT(*) FROM public.classroom_participants p WHERE p.session_id = s.id
          ),
          'submitted_results', (
            SELECT COUNT(*) FROM public.classroom_results x WHERE x.session_id = s.id
          )
        )
        ORDER BY s.started_at DESC
      )
      FROM public.classroom_sessions s
      JOIN public.classroom_rooms r ON r.id = s.room_id
      WHERE s.started_at >= now() - make_interval(days => v_days)
        AND (p_room_code IS NULL OR r.room_code = upper(trim(p_room_code)))
        AND (p_subject IS NULL OR s.subject = p_subject)
        AND (
          auth.uid() IS NOT NULL AND r.host_user_id = auth.uid()
          OR (p_teacher_token IS NOT NULL AND r.teacher_access_token = p_teacher_token AND (r.teacher_token_expires_at IS NULL OR r.teacher_token_expires_at > now()))
        )
    ), '[]'::jsonb)
  );
END;
$$;

-- ── Grants ──────────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.is_feature_enabled(text, boolean) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_classroom_room(text, text, integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_teacher_access(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_classroom_join(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.start_classroom_session(text, text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_classroom_result(uuid, text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.finalize_classroom_session(uuid, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_classroom_report(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.export_classroom_report_csv(uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_classroom_reports(text, text, integer, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_app_event(text, uuid, uuid, jsonb) TO anon, authenticated, service_role;
