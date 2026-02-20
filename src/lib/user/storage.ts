import { UserProfile, MatchHistory, GameResult, DEFAULT_AVATAR_CONFIG, RANK_TIERS, RANK_THRESHOLDS } from "@/types";
import { getTierFromTrophies, RANK_REWARD_ITEM_IDS, getMMRForTier, calculateNewMMR, MMR_DEFAULT, getPlacementTier } from "@/lib/game/rank";
import { FREE_ITEM_IDS } from "@/lib/cosmetics/catalog";
import { getLevel, LEVEL_REWARDS } from "@/lib/user/levels";

const STORAGE_KEYS = {
  PROFILE: "ll_profile",
  PROFILE_UPDATED_AT_MS: "ll_profile_updated_at_ms",
  MATCH_HISTORY: "ll_match_history",
  PERSONAL_BEST: "ll_personal_best",
};

export interface SaveProfileOptions {
  source?: "local" | "remote";
  emitSyncEvent?: boolean;
  remoteUpdatedAt?: string;
}

/** Static profile for SSR-safe initial state. Same on server and client to avoid hydration mismatch. */
export const INITIAL_PROFILE: UserProfile = {
  id: "guest",
  email: "",
  username: "Challenger",
  rank_tier: "Bronze",
  trophies: 0,
  xp: 0,
  ink_drops: 0,
  unlocked_items: ["droplet_01", "droplet_02", "color_#1E293B", "color_#3B82F6", "eyes_01", "none"],
  daily_reward_claimed_at: null,
  daily_streak: 0,
  avatar_config: { ...DEFAULT_AVATAR_CONFIG },
  tutorial_completed: false,
  created_at: "1970-01-01T00:00:00.000Z",
  updated_at: "1970-01-01T00:00:00.000Z",
};

// ── Profile ───────────────────────────────────────────────────────────────────
export function getProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as UserProfile;
    // Always derive rank_tier from trophies so it stays correct when crossing thresholds
    return { ...p, rank_tier: getTierFromTrophies(p.trophies ?? 0) as UserProfile["rank_tier"] };
  } catch {
    return null;
  }
}

export function createGuestProfile(): UserProfile {
  const profile: UserProfile = {
    id: `guest_${Date.now()}`,
    email: "",
    username: "Challenger",
    rank_tier: "Bronze",
    trophies: 0,
    xp: 0,
    ink_drops: 0,
    unlocked_items: [...FREE_ITEM_IDS],
    daily_reward_claimed_at: null,
    daily_streak: 0,
    avatar_config: { ...DEFAULT_AVATAR_CONFIG },
    tutorial_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  saveProfile(profile);
  return profile;
}

export function getLocalProfileUpdatedAtMs(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(STORAGE_KEYS.PROFILE_UPDATED_AT_MS);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function saveProfile(profile: UserProfile, options?: SaveProfileOptions): void {
  if (typeof window === "undefined") return;
  // Always derive rank_tier from trophies so it stays correct when crossing thresholds
  const toSave: UserProfile = {
    ...profile,
    rank_tier: getTierFromTrophies(profile.trophies ?? 0) as UserProfile["rank_tier"],
  };
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(toSave));
  const source = options?.source ?? "local";
  const updatedAtMs =
    source === "remote" && options?.remoteUpdatedAt
      ? Date.parse(options.remoteUpdatedAt)
      : Date.now();
  localStorage.setItem(
    STORAGE_KEYS.PROFILE_UPDATED_AT_MS,
    String(Number.isFinite(updatedAtMs) ? updatedAtMs : Date.now())
  );
  const shouldEmit = options?.emitSyncEvent ?? source === "local";
  if (shouldEmit) {
    window.dispatchEvent(new CustomEvent("ll-profile-updated", { detail: { source } }));
  }
}

/** Map placement match accuracy to starting vocab grade (3-8). */
function getPlacementVocabGrade(correct: number, total: number): 3 | 4 | 5 | 6 | 7 | 8 {
  const accuracy = total > 0 ? correct / total : 0;
  if (accuracy >= 0.85) return 8;
  if (accuracy >= 0.75) return 7;
  if (accuracy >= 0.65) return 6;
  if (accuracy >= 0.55) return 5;
  if (accuracy >= 0.45) return 4;
  return 3;
}

export function applyGameResult(result: GameResult): UserProfile {
  const profile = getProfile() ?? createGuestProfile();
  const isPlacement = result.mode === "ranked" && !profile.placement_completed;

  const xpBase = profile.xp ?? 0;
  if (isPlacement) {
    profile.placement_vocab_grade = getPlacementVocabGrade(result.correct, result.totalQuestions);
    profile.placement_completed = true;
    profile.xp = xpBase + result.correct * 5 + 20;
    profile.ink_drops = (profile.ink_drops ?? 0) + result.correct * 2 + 5;
    // No trophy change for placement match; set initial MMR from placement tier
    const { tier: placementTier } = getPlacementTier(result.correct, result.totalQuestions || 0);
    profile.mmr = getMMRForTier(placementTier);
  } else {
    profile.trophies = Math.max(0, (profile.trophies ?? 0) + result.trophiesChange);
    profile.xp = xpBase + result.correct * 5 + (result.trophiesChange > 0 ? 20 : 0);
    profile.rank_tier = getTierFromTrophies(profile.trophies);
    const dropsEarned = result.correct * 2 + (result.trophiesChange > 0 ? 5 : 0);
    profile.ink_drops = (profile.ink_drops ?? 0) + dropsEarned;
    if (result.mode === "ranked") {
      if (result.trophiesChange > 0) {
        profile.ranked_win_streak = (profile.ranked_win_streak ?? 0) + 1;
      } else {
        profile.ranked_win_streak = 0;
      }
      // Update MMR (Elo-style)
      const opponentTier = profile.rank_tier; // Bots match player tier
      const opponentMMR = getMMRForTier(opponentTier);
      const currentMMR = profile.mmr ?? MMR_DEFAULT;
      const gameResult = result.trophiesChange > 0 ? "win" : result.trophiesChange < 0 ? "loss" : "draw";
      profile.mmr = calculateNewMMR(currentMMR, opponentMMR, gameResult);
    }
  }

  // Unlock ranked reward skins per tier
  if (result.mode === "ranked") {
    if (!profile.unlocked_items) profile.unlocked_items = [...FREE_ITEM_IDS];
    for (const tier of RANK_TIERS) {
      const threshold = RANK_THRESHOLDS[tier];
      const reached = tier === "Bronze" ? true : profile.trophies >= threshold;
      if (reached) {
        for (const itemId of RANK_REWARD_ITEM_IDS[tier]) {
          if (!profile.unlocked_items.includes(itemId)) {
            profile.unlocked_items.push(itemId);
          }
        }
      }
    }
  }

  saveProfile(profile);
  return profile;
}

export function addInkDrops(amount: number): UserProfile {
  const profile = getProfile() ?? createGuestProfile();
  profile.ink_drops = (profile.ink_drops ?? 0) + amount;
  saveProfile(profile);
  return profile;
}

export function spendInkDrops(amount: number): boolean {
  const profile = getProfile() ?? createGuestProfile();
  if ((profile.ink_drops ?? 0) < amount) return false;
  profile.ink_drops = (profile.ink_drops ?? 0) - amount;
  saveProfile(profile);
  return true;
}

export function unlockItem(itemId: string): void {
  const profile = getProfile() ?? createGuestProfile();
  if (!profile.unlocked_items) profile.unlocked_items = [...FREE_ITEM_IDS];
  if (!profile.unlocked_items.includes(itemId)) {
    profile.unlocked_items.push(itemId);
  }
  saveProfile(profile);
}

/** Claim a level reward. Returns true if claimed successfully. */
export function claimLevelReward(level: number): { success: boolean; error?: string } {
  const profile = getProfile() ?? createGuestProfile();
  const claimed = profile.claimed_level_rewards ?? [];
  if (claimed.includes(level)) {
    return { success: false, error: "Already claimed" };
  }
  const currentLevel = getLevel(profile.xp);
  if (currentLevel < level) {
    return { success: false, error: "Level not reached" };
  }
  const reward = LEVEL_REWARDS.find((r: { level: number }) => r.level === level);
  if (!reward) return { success: false, error: "Unknown reward" };

  if (reward.type === "ink_drops" && reward.amount) {
    profile.ink_drops = (profile.ink_drops ?? 0) + reward.amount;
  } else if (reward.type === "cosmetic" && reward.itemId) {
    if (!profile.unlocked_items) profile.unlocked_items = [...FREE_ITEM_IDS];
    if (!profile.unlocked_items.includes(reward.itemId)) {
      profile.unlocked_items.push(reward.itemId);
    }
  }
  // title and badge: just mark as claimed (cosmetic display only for now)
  profile.claimed_level_rewards = [...claimed, level];
  saveProfile(profile);
  return { success: true };
}

export function isLevelRewardClaimed(level: number, profile: UserProfile | null): boolean {
  if (!profile) return false;
  return (profile.claimed_level_rewards ?? []).includes(level);
}

/** Ensure profile has all rank-reward skins for tiers reached by current trophies. */
export function ensureRankRewardsUnlocked(profile: UserProfile): void {
  if (!profile.unlocked_items) profile.unlocked_items = [...FREE_ITEM_IDS];
  const trophies = profile.trophies ?? 0;
  for (const tier of RANK_TIERS) {
    const threshold = RANK_THRESHOLDS[tier];
    const reached = tier === "Bronze" ? true : trophies >= threshold;
    if (reached) {
      for (const itemId of RANK_REWARD_ITEM_IDS[tier]) {
        if (!profile.unlocked_items.includes(itemId)) {
          profile.unlocked_items.push(itemId);
        }
      }
    }
  }
}

export function isItemUnlocked(itemId: string, profile: UserProfile | null): boolean {
  if (!profile) return FREE_ITEM_IDS.includes(itemId);
  const unlocked = profile.unlocked_items ?? FREE_ITEM_IDS;
  return unlocked.includes(itemId);
}

// ── Match history ──────────────────────────────────────────────────────────────
export function getMatchHistory(): MatchHistory[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEYS.MATCH_HISTORY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as MatchHistory[];
  } catch {
    return [];
  }
}

export function saveMatchResult(
  result: GameResult,
  userId: string
): void {
  const history = getMatchHistory();
  const entry: MatchHistory = {
    user_id: userId,
    mode: result.mode,
    score: result.score,
    accuracy: result.accuracy,
    result: result.trophiesChange > 0 ? "win" : result.trophiesChange < 0 ? "loss" : "draw",
    trophies_change: result.trophiesChange,
    created_at: new Date().toISOString(),
  };
  history.unshift(entry);
  if (typeof window !== "undefined") {
    localStorage.setItem(
      STORAGE_KEYS.MATCH_HISTORY,
      JSON.stringify(history.slice(0, 50)) // keep last 50
    );
  }
}

// ── Personal bests ─────────────────────────────────────────────────────────────
interface PersonalBests {
  casual_vocab: number;
  casual_punctuation: number;
  ranked: number;
}

export function getPersonalBests(): PersonalBests {
  if (typeof window === "undefined")
    return { casual_vocab: 0, casual_punctuation: 0, ranked: 0 };
  const raw = localStorage.getItem(STORAGE_KEYS.PERSONAL_BEST);
  if (!raw) return { casual_vocab: 0, casual_punctuation: 0, ranked: 0 };
  try {
    return JSON.parse(raw) as PersonalBests;
  } catch {
    return { casual_vocab: 0, casual_punctuation: 0, ranked: 0 };
  }
}

export function updatePersonalBest(result: GameResult): boolean {
  const bests = getPersonalBests();
  let key: keyof PersonalBests;
  if (result.mode === "ranked") {
    key = "ranked";
  } else if (result.subject === "punctuation") {
    key = "casual_punctuation";
  } else {
    key = "casual_vocab";
  }

  if (result.score > bests[key]) {
    bests[key] = result.score;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.PERSONAL_BEST, JSON.stringify(bests));
    }
    return true; // new personal best!
  }
  return false;
}
