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
  | "capitalization"
  | "contractions"
  | "end-marks"
  | "dialogue-punctuation"
  | "introductory-elements"
  | "nonrestrictive-elements"
  | "coordinate-adjectives"
  | "colons"
  | "dashes"
  | "hyphens"
  | "fragments-run-ons"
  | "conjunctions"
  | "sentence-variety"
  | "paired-punctuation";

export type VocabGrade = 3 | 4 | 5 | 6 | 7;
/**
 * Extended vocab level: grades 3-7 (elementary/middle school),
 * then English 1-3 and AP courses (high school class levels).
 */
export type VocabLevel = VocabGrade | "english1" | "english2" | "english3" | "ap-lang" | "ap-lit";

/** Punctuation difficulty: 1=beginner, 2=intermediate, 3=advanced. Used in casual mode. */
export type PunctuationLevel = 1 | 2 | 3;

export interface Question {
  id: string;
  subject: Subject;
  difficulty: Difficulty;
  skill_tag: SkillTag;
  prompt: string;
  choices: string[];
  answer_index: number;
  /** For vocabulary: target tier level. Used for casual grade selection. */
  gradeLevel?: VocabLevel;
  /** For punctuation: 1=beginner, 2=intermediate, 3=advanced. Used for punctuation level selection. */
  punctuationLevel?: PunctuationLevel;
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
  Silver: 100,
  Gold: 350,
  Platinum: 1000,
  Diamond: 1500,
  Emerald: 2500,
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
  account_type?: "student" | "teacher";
  teacher_approved?: boolean;
  teacher_school_id?: string | null;
  teacher_verified_at?: string | null;
  rank_tier: RankTier;
  trophies: number;
  xp: number;
  ink_drops: number;
  unlocked_items: string[];
  daily_reward_claimed_at: string | null;
  daily_streak: number;
  avatar_config: InkAvatarConfig;
  /** Preferred vocab level for casual mode. */
  vocab_grade?: VocabLevel;
  /** Level numbers for which rewards have been claimed (Level & Rewards screen). */
  claimed_level_rewards?: number[];
  /** Hidden MMR for ranked matchmaking (admin-only in Supabase). */
  mmr?: number;
  /** Set after placement match; determines ranked question difficulty. */
  placement_vocab_grade?: VocabGrade;
  /** Consecutive days with at least one study session completed. */
  study_streak?: number;
  /** ISO timestamp of last study session. */
  last_study_session_at?: string | null;
  /** True after first ranked game (placement). */
  placement_completed?: boolean;
  /** True after completing or skipping the first-time home tutorial. */
  tutorial_completed?: boolean;
  /** True after completing onboarding (username + default vocab grade). */
  onboarding_completed?: boolean;
  /** Consecutive ranked wins; resets on loss/draw. Used for trophy multiplier. */
  ranked_win_streak?: number;
  created_at: string;
  /** Last update timestamp from Supabase row (if loaded from cloud). */
  updated_at?: string;
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

/** Metadata passed after a game to show rank-up/level-up popups */
export interface GameResultMetadata {
  rankUp?: { newTier: string };
  levelUp?: { newLevel: number; hasUnclaimedRewards: boolean };
}

// ── Ink Avatar ──────────────────────────────────────────────────────────────
export interface InkAvatarConfig {
  base: string;
  color: string;
  eyes: string;
  accessory: string;
  /** Optional second accessory slot. */
  accessory2?: string;
  aura: string;
  /** Separate color for the aura effect. Falls back to body color if unset. */
  aura_color?: string;
}

export const DEFAULT_AVATAR_CONFIG: InkAvatarConfig = {
  base: "droplet_01",
  color: "#1E293B",
  eyes: "eyes_01",
  accessory: "none",
  accessory2: "none",
  aura: "none",
};

// ── Skill Stats ──────────────────────────────────────────────────────────────
export interface UserSkillStats {
  user_id: string;
  skill_tag: SkillTag;
  accuracy: number;
  attempts: number;
}

// ── Classroom ────────────────────────────────────────────────────────────────
export interface ClassroomRoom {
  id: string;
  room_code: string;
  host_user_id?: string | null;
  status: "active" | "closed";
  locked: boolean;
  max_players: number;
  created_at?: string;
  updated_at?: string;
}

export interface ClassroomSession {
  id: string;
  room_id: string;
  seed: string;
  subject: Subject;
  vocab_level?: string | null;
  punctuation_level?: number | null;
  host_plays: boolean;
  allow_late_join?: boolean;
  started_at: string;
  ended_at?: string | null;
  status: "running" | "completed" | "aborted";
  ended_reason?: string | null;
}

export interface ClassroomParticipant {
  participant_id: string;
  display_name: string;
  role: "host" | "student";
  joined_at?: string | null;
  left_at?: string | null;
  was_kicked?: boolean;
}

export interface ClassroomResult {
  participant_id: string;
  score: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  finished_at?: string | null;
  skill_breakdown?: Record<string, unknown>;
}

// ── Teacher Portal ────────────────────────────────────────────────────────────
export interface School {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export type TeacherVerificationStatus = "pending" | "approved" | "rejected" | "auto_approved" | null;

export interface TeacherPortalStatus {
  account_type: "student" | "teacher";
  teacher_approved: boolean;
  teacher_school_id: string | null;
  teacher_verified_at: string | null;
  teacher_type: "homeschool" | "public" | null;
  teacher_grade: string | null;
  teacher_subject: string | null;
  teacher_onboarding_completed: boolean;
  verification_status: TeacherVerificationStatus;
  verification_reason: string | null;
  verification_created_at: string | null;
  verification_reviewed_at: string | null;
}

export interface TeacherVerificationRequest {
  id: string;
  user_id: string;
  school_id: string;
  school_email: string;
  email_domain: string;
  status: Exclude<TeacherVerificationStatus, null>;
  decision_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeacherClass {
  id: string;
  name: string;
  grade_label?: string | null;
  subject?: string | null;
  archived: boolean;
  join_code?: string | null;
  created_at: string;
  updated_at: string;
  roster_count: number;
}

export interface RosterStudent {
  id: string;
  class_id: string;
  display_name: string;
  student_identifier?: string | null;
  linked_user_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CsvImportResultRow {
  row: {
    display_name?: string;
    student_identifier?: string;
    notes?: string;
  };
  error: string;
}

export interface StudentClass {
  id: string;
  name: string;
  grade_label?: string | null;
  subject?: string | null;
  teacher_name?: string | null;
  roster_count: number;
}

export interface Classmate {
  id: string;
  display_name: string;
  student_identifier?: string | null;
  linked_user_id?: string | null;
  avatar_config?: Record<string, unknown> | null;
}
