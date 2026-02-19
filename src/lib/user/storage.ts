import { UserProfile, MatchHistory, GameResult, DEFAULT_AVATAR_CONFIG } from "@/types";
import { getTierFromTrophies, RANK_REWARD_ITEM_IDS, RANK_TIERS, RANK_THRESHOLDS } from "@/lib/game/rank";
import { FREE_ITEM_IDS } from "@/lib/cosmetics/catalog";

const STORAGE_KEYS = {
  PROFILE: "ll_profile",
  MATCH_HISTORY: "ll_match_history",
  PERSONAL_BEST: "ll_personal_best",
};

// ── Profile ───────────────────────────────────────────────────────────────────
export function getProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
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
    created_at: new Date().toISOString(),
  };
  saveProfile(profile);
  return profile;
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

export function applyGameResult(result: GameResult): UserProfile {
  let profile = getProfile() ?? createGuestProfile();
  profile.trophies = Math.max(0, profile.trophies + result.trophiesChange);
  profile.xp += result.correct * 5 + (result.trophiesChange > 0 ? 20 : 0);
  profile.rank_tier = getTierFromTrophies(profile.trophies);
  const dropsEarned = result.correct * 2 + (result.trophiesChange > 0 ? 5 : 0);
  profile.ink_drops = (profile.ink_drops ?? 0) + dropsEarned;

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
