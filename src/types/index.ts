// ── Question ────────────────────────────────────────────────────────────────
export type Subject = "vocabulary" | "punctuation";
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type SkillTag =
  | "synonyms"
  | "antonyms"
  | "definitions"
  | "context-clues"
  | "word-forms"
  | "commas"
  | "apostrophes"
  | "quotation-marks"
  | "semicolons"
  | "capitalization";

export type VocabGrade = 3 | 4 | 5 | 6 | 7 | 8;
/** Extended vocab level: grades 3-8, or PSAT/SAT for advanced test prep. */
export type VocabLevel = VocabGrade | "psat" | "sat";

export interface Question {
  id: string;
  subject: Subject;
  difficulty: Difficulty;
  skill_tag: SkillTag;
  prompt: string;
  choices: string[];
  answer_index: number;
  /** For vocabulary: target grade level (3-8, psat, sat). Used for casual grade selection. */
  gradeLevel?: VocabGrade | "psat" | "sat";
}

// ── Rank ────────────────────────────────────────────────────────────────────
export type RankTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Emerald";

export const RANK_TIERS: RankTier[] = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Emerald",
];

export const RANK_THRESHOLDS: Record<RankTier, number> = {
  Bronze: 0,
  Silver: 300,
  Gold: 700,
  Platinum: 1200,
  Diamond: 2000,
  Emerald: 3000,
};

export const RANK_COLORS: Record<RankTier, string> = {
  Bronze: "#CD7F32",
  Silver: "#C0C0C0",
  Gold: "#D4AF37",
  Platinum: "#7DD3FC",
  Diamond: "#A78BFA",
  Emerald: "#10B981",
};

export const RANK_BADGE: Record<RankTier, string> = {
  Bronze: "🥉",
  Silver: "🥈",
  Gold: "🏆",
  Platinum: "💎",
  Diamond: "✨",
  Emerald: "💚",
};

export const RANK_INKLING_CONFIG: Record<RankTier, { base: string; eyes: string; accessory: string; aura: string }> = {
  Bronze: { base: "droplet_01", eyes: "eyes_01", accessory: "none", aura: "none" },
  Silver: { base: "droplet_01", eyes: "eyes_02", accessory: "headband_01", aura: "none" },
  Gold: { base: "droplet_02", eyes: "eyes_02", accessory: "crown_01", aura: "none" },
  Platinum: { base: "droplet_03", eyes: "eyes_05", accessory: "tophat_01", aura: "aura_glow_01" },
  Diamond: { base: "droplet_04", eyes: "eyes_05", accessory: "halo_01", aura: "aura_glow_02" },
  Emerald: { base: "droplet_05", eyes: "eyes_05", accessory: "crown_01", aura: "aura_glow_03" },
};

// ── User ────────────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  rank_tier: RankTier;
  trophies: number;
  xp: number;
  ink_drops: number;
  unlocked_items: string[];
  daily_reward_claimed_at: string | null;
  daily_streak: number;
  avatar_config: InkAvatarConfig;
  /** Preferred vocab level for casual mode (grades 3-8, psat, sat). */
  vocab_grade?: VocabLevel;
  /** Level numbers for which rewards have been claimed (Level & Rewards screen). */
  claimed_level_rewards?: number[];
  created_at: string;
}

// ── Match ───────────────────────────────────────────────────────────────────
export type GameMode = "casual" | "ranked";
export type MatchResult = "win" | "loss" | "draw";

export interface MatchHistory {
  user_id: string;
  mode: GameMode;
  score: number;
  accuracy: number;
  result: MatchResult;
  trophies_change: number;
  created_at: string;
}

// ── Game State ───────────────────────────────────────────────────────────────
export interface GameState {
  mode: GameMode;
  subject: Subject;
  questions: Question[];
  currentIndex: number;
  score: number;
  correctCount: number;
  incorrectCount: number;
  timeLeft: number;
  isFinished: boolean;
  answers: (number | null)[];
}

export interface GameResult {
  score: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  totalQuestions: number;
  mode: GameMode;
  subject: Subject;
  trophiesChange: number;
  newTier?: RankTier;
}

// ── Ink Avatar ──────────────────────────────────────────────────────────────
export interface InkAvatarConfig {
  base: string;
  color: string;
  eyes: string;
  accessory: string;
  aura: string;
}

export const DEFAULT_AVATAR_CONFIG: InkAvatarConfig = {
  base: "droplet_01",
  color: "#1E293B",
  eyes: "eyes_01",
  accessory: "none",
  aura: "none",
};

// ── Skill Stats ──────────────────────────────────────────────────────────────
export interface UserSkillStats {
  user_id: string;
  skill_tag: SkillTag;
  accuracy: number;
  attempts: number;
}
