export type ClassroomPhase = "entry" | "lobby" | "countdown" | "playing" | "hosting" | "results";

export interface ScoreLike {
  score?: number;
  correct?: number;
  finishedAt?: number;
}

export interface StandingLike {
  id: string;
  joinedAt: number;
  scorePayload: ScoreLike | null;
}

export function shouldAcceptEvent(
  seenEventIds: Set<string>,
  eventId?: string | null
): boolean {
  if (!eventId) return true;
  if (seenEventIds.has(eventId)) return false;
  seenEventIds.add(eventId);
  return true;
}

export function isHostTimedOut(
  lastHeartbeatMs: number,
  nowMs: number,
  timeoutMs: number
): boolean {
  return nowMs - lastHeartbeatMs > timeoutMs;
}

export function sortStandings(rows: StandingLike[]): StandingLike[] {
  return [...rows].sort((a, b) => {
    if (a.scorePayload && !b.scorePayload) return -1;
    if (!a.scorePayload && b.scorePayload) return 1;
    if (!a.scorePayload && !b.scorePayload) return a.joinedAt - b.joinedAt;

    const scoreDiff = (b.scorePayload?.score ?? 0) - (a.scorePayload?.score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;

    const correctDiff = (b.scorePayload?.correct ?? 0) - (a.scorePayload?.correct ?? 0);
    if (correctDiff !== 0) return correctDiff;

    return (a.scorePayload?.finishedAt ?? Number.MAX_SAFE_INTEGER) - (b.scorePayload?.finishedAt ?? Number.MAX_SAFE_INTEGER);
  });
}

export function nextPhaseAfterEndMatch(
  phase: ClassroomPhase,
  sameSeed: boolean
): ClassroomPhase {
  if (!sameSeed) return phase;
  if (phase === "playing") return "playing";
  if (phase === "hosting") return "results";
  if (phase === "countdown") return "lobby";
  return phase;
}
