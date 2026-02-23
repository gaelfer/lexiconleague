-- Join success rate (last 24h)
SELECT
  ROUND(
    100.0 * SUM(CASE WHEN event_name = 'classroom_join_success' THEN 1 ELSE 0 END)
    / NULLIF(SUM(CASE WHEN event_name IN ('classroom_join_success', 'classroom_join_failed') THEN 1 ELSE 0 END), 0),
    2
  ) AS join_success_pct
FROM public.app_events
WHERE created_at >= now() - interval '24 hours';

-- Session start success rate (last 24h)
SELECT
  ROUND(
    100.0 * SUM(CASE WHEN event_name = 'classroom_session_start_success' THEN 1 ELSE 0 END)
    / NULLIF(SUM(CASE WHEN event_name IN ('classroom_session_start_success', 'classroom_session_start_failed') THEN 1 ELSE 0 END), 0),
    2
  ) AS session_start_success_pct
FROM public.app_events
WHERE created_at >= now() - interval '24 hours';

-- Reconnect/host timeout proxy
SELECT
  COUNT(*) FILTER (WHERE event_name = 'classroom_teacher_access_failed') AS teacher_access_failures,
  COUNT(*) FILTER (WHERE event_name = 'classroom_result_submit_failed') AS result_submit_failures
FROM public.app_events
WHERE created_at >= now() - interval '24 hours';

-- Report generation coverage (last 30d)
SELECT
  COUNT(*) FILTER (WHERE status IN ('completed', 'aborted')) AS ended_sessions,
  COUNT(*) FILTER (WHERE status IN ('completed', 'aborted') AND EXISTS (
    SELECT 1 FROM public.classroom_results r WHERE r.session_id = s.id
  )) AS sessions_with_results,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status IN ('completed', 'aborted') AND EXISTS (
      SELECT 1 FROM public.classroom_results r WHERE r.session_id = s.id
    ))
    / NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'aborted')), 0),
    2
  ) AS report_generation_pct
FROM public.classroom_sessions s
WHERE started_at >= now() - interval '30 days';
