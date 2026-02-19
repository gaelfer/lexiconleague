import { RankTier, RANK_TIERS, RANK_THRESHOLDS, GameMode } from "@/types";

// ── Trophy deltas ─────────────────────────────────────────────────────────────
const TROPHY_WIN: Record<RankTier, number> = {
  Bronze: 20,
  Silver: 18,
  Gold: 16,
  Platinum: 14,
  Diamond: 12,
};

const TROPHY_LOSS: Record<RankTier, number> = {
  Bronze: -10,
  Silver: -12,
  Gold: -14,
  Platinum: -16,
  Diamond: -18,
};

// Score needed (out of possible) to count as a "win"
const WIN_SCORE_THRESHOLD = 0.6; // 60% accuracy

// ── Scoring ───────────────────────────────────────────────────────────────────
export const POINTS_PER_CORRECT = 10;
export const POINTS_PER_INCORRECT = 0;
export const GAME_DURATION = 60; // seconds

export function calculateScore(correct: number): number {
  return correct * POINTS_PER_CORRECT;
}

export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

// ── Result determination ──────────────────────────────────────────────────────
export function determineResult(
  correct: number,
  total: number
): "win" | "loss" | "draw" {
  if (total === 0) return "loss";
  const accuracy = correct / total;
  if (accuracy >= WIN_SCORE_THRESHOLD) return "win";
  if (accuracy >= WIN_SCORE_THRESHOLD - 0.1) return "draw";
  return "loss";
}

// ── Trophy calculation ────────────────────────────────────────────────────────
export function calculateTrophyChange(
  result: "win" | "loss" | "draw",
  tier: RankTier,
  mode: GameMode
): number {
  if (mode === "casual") return 0; // No trophy impact for casual

  if (result === "win") return TROPHY_WIN[tier];
  if (result === "loss") return TROPHY_LOSS[tier];
  return 0; // draw
}

// ── Tier from trophies ────────────────────────────────────────────────────────
export function getTierFromTrophies(trophies: number): RankTier {
  let tier: RankTier = "Bronze";
  for (const t of RANK_TIERS) {
    if (trophies >= RANK_THRESHOLDS[t]) {
      tier = t;
    }
  }
  return tier;
}

export function getTrophiesInTier(trophies: number, tier: RankTier): number {
  return trophies - RANK_THRESHOLDS[tier];
}

export function getTrophiesNeededForNextTier(tier: RankTier): number | null {
  const idx = RANK_TIERS.indexOf(tier);
  if (idx === RANK_TIERS.length - 1) return null; // Diamond — max tier
  const nextTier = RANK_TIERS[idx + 1];
  return RANK_THRESHOLDS[nextTier];
}

export function getTierProgress(trophies: number, tier: RankTier): number {
  const tierStart = RANK_THRESHOLDS[tier];
  const idx = RANK_TIERS.indexOf(tier);
  if (idx === RANK_TIERS.length - 1) return 100;
  const nextTier = RANK_TIERS[idx + 1];
  const tierEnd = RANK_THRESHOLDS[nextTier];
  const progress = ((trophies - tierStart) / (tierEnd - tierStart)) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}

// ── Placement assessment ──────────────────────────────────────────────────────
export function getPlacementTier(
  correct: number,
  total: number
): { tier: RankTier; trophies: number } {
  const accuracy = total > 0 ? correct / total : 0;

  if (accuracy >= 0.85) return { tier: "Gold", trophies: 700 };
  if (accuracy >= 0.70) return { tier: "Silver", trophies: 400 };
  if (accuracy >= 0.50) return { tier: "Silver", trophies: 300 };
  return { tier: "Bronze", trophies: 50 };
}
