import { InkAvatarConfig, RankTier } from "@/types";

export interface OpponentInfo {
  id: string;
  username: string;
  rank_tier: RankTier;
  avatar_config: InkAvatarConfig;
  isBot: boolean;
}

const BOT_NAMES = [
  "InkBot Alpha",
  "WordSmith 3000",
  "Lexicon Larry",
  "Grammar Gremlin",
  "Vocab Viper",
  "Syntax Sage",
  "Comma Commander",
  "Word Wizard",
  "Dictionary Dan",
  "Spellcheck Sally",
];

const BOT_AVATARS: InkAvatarConfig[] = [
  { base: "droplet_01", color: "#EF4444", eyes: "eyes_02", accessory: "crown_01", accessory2: "sword_01", aura: "none" },
  { base: "droplet_02", color: "#8B5CF6", eyes: "eyes_04", accessory: "glasses_01", aura: "aura_glow_01" },
  { base: "droplet_03", color: "#22C55E", eyes: "eyes_03", accessory: "wizard_01", aura: "none" },
  { base: "droplet_04", color: "#3B82F6", eyes: "eyes_05", accessory: "monocle_01", accessory2: "cane_01", aura: "aura_glow_02" },
  { base: "droplet_05", color: "#EC4899", eyes: "eyes_06", accessory: "bow_01", aura: "none" },
  { base: "droplet_01", color: "#F97316", eyes: "eyes_07", accessory: "tophat_01", aura: "aura_glow_03" },
  { base: "droplet_02", color: "#06B6D4", eyes: "eyes_08", accessory: "scarf_01", aura: "none" },
  { base: "droplet_03", color: "#EAB308", eyes: "eyes_01", accessory: "helmet_01", accessory2: "axe_01", aura: "aura_glow_01" },
];

export function generateBotOpponent(playerTier: RankTier): OpponentInfo {
  return {
    id: `bot_${Date.now()}`,
    username: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
    rank_tier: playerTier,
    avatar_config: BOT_AVATARS[Math.floor(Math.random() * BOT_AVATARS.length)],
    isBot: true,
  };
}

/** Generate N unique bot opponents (distinct names and avatars). */
export function generateBotOpponents(playerTier: RankTier, count: number): OpponentInfo[] {
  const usedNames = new Set<string>();
  const usedAvatarIndices = new Set<number>();
  const result: OpponentInfo[] = [];
  for (let i = 0; i < count; i++) {
    let name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    while (usedNames.has(name)) {
      name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    }
    usedNames.add(name);
    let avatarIdx = Math.floor(Math.random() * BOT_AVATARS.length);
    while (usedAvatarIndices.has(avatarIdx)) {
      avatarIdx = Math.floor(Math.random() * BOT_AVATARS.length);
    }
    usedAvatarIndices.add(avatarIdx);
    result.push({
      id: `bot_${Date.now()}_${i}`,
      username: name,
      rank_tier: playerTier,
      avatar_config: BOT_AVATARS[avatarIdx],
      isBot: true,
    });
  }
  return result;
}

export function generateBotScore(playerTier: RankTier): { correct: number; incorrect: number; total: number } {
  // Bronze/Silver: forgiving. Gold: 50/50 gate. Platinum: beatable by good players.
  // Diamond/Emerald: only exceptional players can climb.
  const correctRanges: Record<string, [number, number]> = {
    Bronze: [4, 10],
    Silver: [7, 13],
    Gold: [7, 13],    // easy to beat for a focused player
    Platinum: [17, 22],
    Diamond: [21, 26],
    Emerald: [23, 28],
  };
  const incorrectRanges: Record<string, [number, number]> = {
    Bronze: [3, 6],
    Silver: [2, 5],
    Gold: [3, 7],   // more misses → lower total answered
    Platinum: [1, 3],
    Diamond: [0, 2],
    Emerald: [0, 1],
  };
  const [cMin, cMax] = correctRanges[playerTier] ?? [5, 12];
  const [iMin, iMax] = incorrectRanges[playerTier] ?? [2, 4];
  const correct = cMin + Math.floor(Math.random() * (cMax - cMin + 1));
  const incorrect = iMin + Math.floor(Math.random() * (iMax - iMin + 1));
  return { correct, incorrect, total: correct + incorrect };
}

/**
 * Bot score for 3v3 mode. All bots answer exactly 15 questions (the per-player cap)
 * and have a simulated finish time so tiebreakers can be applied fairly.
 */
export function generateBotScore3v3(playerTier: RankTier): { correct: number; total: number; finishTimeMs: number } {
  const MAX_Q = 15;
  // Correct answers out of 15 — scaled to the 15-question format
  const correctRanges3v3: Record<string, [number, number]> = {
    Bronze:   [5,  9],
    Silver:   [7, 11],
    Gold:     [9, 13],
    Platinum: [10, 13],
    Diamond:  [11, 14],
    Emerald:  [12, 15],
  };
  const [cMin, cMax] = correctRanges3v3[playerTier] ?? [6, 10];
  const correct = cMin + Math.floor(Math.random() * (cMax - cMin + 1));
  // Finish time: bots take 18–52 seconds to answer all 15 questions
  const finishTimeMs = (18 + Math.random() * 34) * 1000;
  return { correct, total: MAX_Q, finishTimeMs };
}

/** Seeded RNG for deterministic bot scores. Same (seed, index) → same result. */
function seededNext(seed: string, index: number): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  let rng = Math.abs((h + index * 31) | 0) % 2147483647;
  return () => {
    rng = (rng * 16807) % 2147483647;
    return rng / 2147483647;
  };
}

/**
 * Deterministic bot score for 3v3. Use when coordinator broadcasts match — all
 * players must see the same bot scores so win/loss is consistent.
 */
export function generateBotScore3v3Seeded(
  seed: string,
  slotIndex: number,
  playerTier: RankTier
): { correct: number; total: number; finishTimeMs: number } {
  const MAX_Q = 15;
  const next = seededNext(seed, slotIndex);
  const correctRanges3v3: Record<string, [number, number]> = {
    Bronze:   [5,  9],
    Silver:   [7, 11],
    Gold:     [9, 13],
    Platinum: [10, 13],
    Diamond:  [11, 14],
    Emerald:  [12, 15],
  };
  const [cMin, cMax] = correctRanges3v3[playerTier] ?? [6, 10];
  const correct = cMin + Math.floor(next() * (cMax - cMin + 1));
  const finishTimeMs = (18 + next() * 34) * 1000;
  return { correct, total: MAX_Q, finishTimeMs };
}

export const MATCHMAKING_TIMEOUT_MS = 12_000;

export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const copy = [...arr];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  let rng = Math.abs(hash);
  for (let i = copy.length - 1; i > 0; i--) {
    rng = (rng * 16807 + 0) % 2147483647;
    const j = rng % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateMatchSeed(): string {
  return `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
