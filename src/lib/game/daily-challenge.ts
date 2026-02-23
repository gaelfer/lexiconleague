import { Question, VocabLevel } from "@/types";
import { getSeededQuestionsForUnit } from "./questions";
import { TIER_UNITS, UNIT_SKILL_TAG_FILTERS, LEVEL_DISPLAY } from "./curriculum";

export const DAILY_CHALLENGE_MAX_ATTEMPTS = 3;
export const DAILY_CHALLENGE_QUESTION_COUNT = 20;
export const DAILY_CHALLENGE_DURATION = 45; // seconds

/** Returns today's date as "YYYY-MM-DD" — used as the question seed. */
export function getDailySeed(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── Daily schedule: one level+unit per day ─────────────────────────────────────

const LEVEL_ORDER: VocabLevel[] = [3, 4, 5, 6, 7, "english1", "english2", "english3", "ap-lang", "ap-lit"];

/** Flattened schedule: every (level, unit) pair. Same order every time. */
function buildDailySchedule(): { level: VocabLevel; unitId: string; unitLabel: string; levelDisplay: string }[] {
  const schedule: { level: VocabLevel; unitId: string; unitLabel: string; levelDisplay: string }[] = [];
  for (const level of LEVEL_ORDER) {
    const units = TIER_UNITS[level] ?? [];
    const levelDisplay = LEVEL_DISPLAY[String(level)] ?? String(level);
    for (const { id, label } of units) {
      schedule.push({ level, unitId: id, unitLabel: label, levelDisplay });
    }
  }
  return schedule;
}

const DAILY_SCHEDULE = buildDailySchedule();

/** Simple string hash for deterministic day → index. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Returns the level+unit for today. Same for all players on the same calendar day. */
export function getDailyChallengeDayConfig(): { level: VocabLevel; unitId: string; unitLabel: string; levelDisplay: string } {
  const seed = getDailySeed();
  const idx = hashString(seed) % DAILY_SCHEDULE.length;
  return DAILY_SCHEDULE[idx];
}

/** Returns the same 20 questions for every player on the same calendar day. */
export function getDailyQuestions(): Question[] {
  const seed = getDailySeed();
  const { level, unitId } = getDailyChallengeDayConfig();
  const skillTags = UNIT_SKILL_TAG_FILTERS[unitId] ?? [];
  return getSeededQuestionsForUnit(level, skillTags, seed, DAILY_CHALLENGE_QUESTION_COUNT);
}

/**
 * Flat completion bonus awarded on the first attempt of the day.
 * Per-correct-answer rewards (2 drops + 5 XP each) are already applied
 * by GameScreen's internal applyGameResult call.
 */
export const DAILY_COMPLETION_BONUS = { drops: 25, xp: 50 } as const;

// ── Topic preview ──────────────────────────────────────────────────────────────

/**
 * Returns topic and grade for today's challenge (for display as "AP Lang · Unit 3: Reasoning & Organization").
 */
export function getDailyChallengeTopicAndGrade(): { topic: string; grade: string } {
  const { levelDisplay, unitLabel } = getDailyChallengeDayConfig();
  return {
    topic: unitLabel,
    grade: levelDisplay,
  };
}

