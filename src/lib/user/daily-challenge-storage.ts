import { UserProfile } from "@/types";
import { getProfile, createGuestProfile, saveProfile } from "./storage";
import { getDailySeed, DAILY_CHALLENGE_MAX_ATTEMPTS, DAILY_COMPLETION_BONUS } from "@/lib/game/daily-challenge";

const STORAGE_KEY = "ll_daily_challenge";

export interface DailyChallengeState {
  date: string;        // YYYY-MM-DD — resets automatically when the date changes
  attempts: number;    // 0–3
  bestScore: number;
  bestCorrect: number;
  rewarded: boolean;   // true once first-completion rewards have been applied
}

const DEFAULT_STATE: DailyChallengeState = {
  date: "",
  attempts: 0,
  bestScore: 0,
  bestCorrect: 0,
  rewarded: false,
};

export function getDailyChallengeState(): DailyChallengeState {
  if (typeof window === "undefined") return { ...DEFAULT_STATE };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_STATE };
  try {
    const parsed = JSON.parse(raw) as DailyChallengeState;
    // If stored date is not today, return a fresh state
    if (parsed.date !== getDailySeed()) return { ...DEFAULT_STATE };
    return parsed;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveDailyChallengeState(state: DailyChallengeState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Returns true if the player still has attempts remaining today. */
export function canAttemptDailyChallenge(): boolean {
  const state = getDailyChallengeState();
  return state.attempts < DAILY_CHALLENGE_MAX_ATTEMPTS;
}

/**
 * Records a completed attempt. Updates best score if improved.
 * Returns the updated state and whether this was a new personal best.
 */
export function recordDailyChallengeAttempt(
  score: number,
  correct: number
): { isNewBest: boolean; state: DailyChallengeState } {
  const state = getDailyChallengeState();
  const today = getDailySeed();

  const isNewBest = score > state.bestScore;
  const updated: DailyChallengeState = {
    date: today,
    attempts: Math.min(state.attempts + 1, DAILY_CHALLENGE_MAX_ATTEMPTS),
    bestScore: isNewBest ? score : state.bestScore,
    bestCorrect: isNewBest ? correct : state.bestCorrect,
    rewarded: state.rewarded,
  };
  saveDailyChallengeState(updated);
  return { isNewBest, state: updated };
}

/**
 * Awards the flat completion bonus for the first daily completion.
 * Per-correct-answer rewards (2 drops + 5 XP each) are already applied
 * by GameScreen's internal applyGameResult call.
 * Should only be called once per day (guarded by `state.rewarded`).
 */
export function applyDailyChallengeRewards(): UserProfile {
  const profile = getProfile() ?? createGuestProfile();
  const { drops, xp } = DAILY_COMPLETION_BONUS;

  profile.ink_drops = (profile.ink_drops ?? 0) + drops;
  profile.xp = (profile.xp ?? 0) + xp;
  saveProfile(profile);

  // Mark as rewarded in the daily state
  const state = getDailyChallengeState();
  saveDailyChallengeState({ ...state, rewarded: true });

  return profile;
}
