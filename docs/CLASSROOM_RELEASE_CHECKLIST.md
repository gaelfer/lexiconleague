# Classroom Release Checklist

## Preconditions
- `classroom_persistence_v1`, `classroom_reports_v1`, and `classroom_access_code_v1` exist in `classroom_feature_flags`.
- Migration `20260301_classroom_complete_app.sql` applied in target environment.
- Classroom host and joiner smoke test passed in staging.

## Critical-path checks
- Create classroom with teacher access code.
- Join classroom with valid PIN.
- Lock room and verify new joins are blocked.
- Start round and verify all connected players receive countdown and game start.
- Submit at least 2 scores and verify leaderboard ordering is deterministic.
- End match and verify session is finalized.
- Open `/classroom/reports`, unlock room, verify session appears.
- Open session detail and export CSV.

## Rollout
1. Internal only:
- Set flags enabled for internal testing cohort.
- Monitor `classroom_join_failed` and `classroom_session_start_failed` events for 24h.

2. 10% rollout:
- Enable `enabled=true, rollout_percent=10` per feature flag.
- Watch join/start/completion metrics for 48h.

3. 50% rollout:
- Increase rollout to 50 after no severe regressions.

4. 100% rollout:
- Increase rollout to 100 after 7 stable days.

## Rollback
- Set all three flags `enabled=false`.
- Verify legacy classroom flow works (`/play/classroom`).
- Keep data tables intact for postmortem and replay.

## Post-release monitoring
- Join success rate >= 99%.
- Session start success rate >= 99%.
- Host timeout rate under agreed threshold.
- Report generation rate >= 80% of hosted sessions.
