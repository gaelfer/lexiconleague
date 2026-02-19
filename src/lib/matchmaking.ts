import { InkAvatarConfig, DEFAULT_AVATAR_CONFIG, RankTier } from "@/types";

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
  { base: "droplet_01", color: "#EF4444", eyes: "eyes_02", accessory: "crown_01", aura: "none" },
  { base: "droplet_02", color: "#8B5CF6", eyes: "eyes_04", accessory: "glasses_01", aura: "aura_glow_01" },
  { base: "droplet_03", color: "#22C55E", eyes: "eyes_03", accessory: "wizard_01", aura: "none" },
  { base: "droplet_04", color: "#3B82F6", eyes: "eyes_05", accessory: "monocle_01", aura: "aura_glow_02" },
  { base: "droplet_05", color: "#EC4899", eyes: "eyes_06", accessory: "bow_01", aura: "none" },
  { base: "droplet_01", color: "#F97316", eyes: "eyes_07", accessory: "tophat_01", aura: "aura_glow_03" },
  { base: "droplet_02", color: "#06B6D4", eyes: "eyes_08", accessory: "scarf_01", aura: "none" },
  { base: "droplet_03", color: "#EAB308", eyes: "eyes_01", accessory: "halo_01", aura: "aura_glow_01" },
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

export function generateBotScore(playerTier: RankTier): { correct: number; incorrect: number; total: number } {
  const ranges: Record<string, [number, number]> = {
    Bronze: [3, 8],
    Silver: [5, 11],
    Gold: [7, 13],
    Platinum: [9, 15],
    Diamond: [11, 17],
  };
  const [min, max] = ranges[playerTier] ?? [4, 10];
  const correct = min + Math.floor(Math.random() * (max - min + 1));
  const incorrect = Math.floor(Math.random() * 5) + 1;
  return { correct, incorrect, total: correct + incorrect };
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
