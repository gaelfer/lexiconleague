"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getProfile, saveProfile, createGuestProfile } from "@/lib/user/storage";
import { createClient } from "@/lib/supabase/client";
import { VocabLevel, UserProfile, Question } from "@/types";
import {
  VOCAB_BY_LEVEL,
  VOCAB_LEVEL_LABELS,
  PUNCTUATION_CURRICULUM_MODULES,
  PUNCTUATION_QUESTIONS,
  getPunctuationQuestionsByModule,
} from "@/lib/game/questions";
import InkAvatar from "@/components/InkAvatar";
import InkDropIcon from "@/components/icons/InkDropIcon";
import SparkIcon from "@/components/icons/SparkIcon";
import LogoIcon from "@/components/icons/LogoIcon";
import ThemeToggle from "@/components/ThemeToggle";
import { BLUE, SURFACE } from "@/lib/design-tokens";
const MINT = "#34D399";
const STUDY_XP_PER_CORRECT = 3;      // ~half of casual (5)
const STUDY_DROPS_PER_CORRECT = 1;   // ~half of casual (2)
const SESSION_QUESTION_COUNT = 12;    // questions per session

// ── Tier metadata ─────────────────────────────────────────────────────────────
const ALL_TIERS: VocabLevel[] = [3, 4, 5, 6, 7, "english1", "english2", "english3", "ap-lang", "ap-lit"];

const TIER_DESCRIPTIONS: Record<VocabLevel, string> = {
  3: "Foundations: story structure, character traits, and context clues.",
  4: "Reading growth: central idea, text evidence, and compare/contrast.",
  5: "Analysis core: theme, craft, figurative language, and revision.",
  6: "Middle school bridge: argument, structure, tone, and synthesis.",
  7: "Pre-AP prep: rhetoric, claims/counterclaims, and precision.",
  "english1": "College Board Pre-AP English 1: close reading and evidence-based writing.",
  "english2": "College Board Pre-AP English 2: argument, synthesis, and style analysis.",
  "english3": "American Literature sequence (FLVS-style): origins to modern U.S. voices.",
  "ap-lang": "College Board AP Lang: rhetorical analysis, argument, and synthesis.",
  "ap-lit": "College Board AP Lit: close reading, poetic analysis, and prose interpretation.",
};

const TIER_DIFFICULTY: Record<VocabLevel, string> = {
  3: "Beginner",
  4: "Beginner",
  5: "Intermediate",
  6: "Intermediate",
  7: "Intermediate",
  "english1": "Advanced",
  "english2": "Advanced",
  "english3": "Advanced",
  "ap-lang": "Expert",
  "ap-lit": "Expert",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: "#34D399",
  Intermediate: "#3B82F6",
  Advanced: "#A78BFA",
  Expert: "#F97316",
};

// ── Study units (placeholder — word lists plugged in later) ───────────────────
const TIER_UNITS: Record<VocabLevel, { id: string; label: string }[]> = {
  3: [
    { id: "story-elements", label: "Unit 1: Story Elements & Characters" },
    { id: "context-clues", label: "Unit 2: Context Clues & Word Meaning" },
    { id: "main-idea", label: "Unit 3: Main Idea & Supporting Details" },
  ],
  4: [
    { id: "text-structure", label: "Unit 1: Text Structure & Sequence" },
    { id: "compare-contrast", label: "Unit 2: Compare/Contrast & Point of View" },
    { id: "evidence", label: "Unit 3: Citing Evidence & Inference" },
  ],
  5: [
    { id: "theme-craft", label: "Unit 1: Theme & Author's Craft" },
    { id: "figurative-language", label: "Unit 2: Figurative Language & Tone" },
    { id: "analysis-writing", label: "Unit 3: Analysis & Revision Language" },
  ],
  6: [
    { id: "argument-evidence", label: "Unit 1: Argument, Claims, and Evidence" },
    { id: "literary-analysis", label: "Unit 2: Literary Analysis & Theme Development" },
    { id: "informational", label: "Unit 3: Informational Text & Synthesis" },
  ],
  7: [
    { id: "rhetoric-devices", label: "Unit 1: Rhetoric & Authorial Choices" },
    { id: "argumentation", label: "Unit 2: Argumentation & Counterclaims" },
    { id: "precision-style", label: "Unit 3: Precision, Connotation, and Style" },
  ],
  "english1": [
    { id: "preap1-close-reading", label: "Unit 1: Pre-AP E1 Close Reading Basics" },
    { id: "preap1-evidence", label: "Unit 2: Textual Evidence & Commentary" },
    { id: "preap1-claims", label: "Unit 3: Claims, Reasoning, and Organization" },
    { id: "preap1-style", label: "Unit 4: Style, Diction, and Revision Moves" },
  ],
  "english2": [
    { id: "preap2-analysis", label: "Unit 1: Pre-AP E2 Author's Choices & Analysis" },
    { id: "preap2-synthesis", label: "Unit 2: Source Integration & Synthesis" },
    { id: "preap2-argument", label: "Unit 3: Argument Development & Counterargument" },
    { id: "preap2-style", label: "Unit 4: Syntax, Nuance, and Voice" },
  ],
  "english3": [
    { id: "amerlit-origins", label: "Unit 1: U.S. Origins, Puritan & Enlightenment Texts" },
    { id: "amerlit-romantic", label: "Unit 2: Romanticism & Transcendentalism" },
    { id: "amerlit-realism", label: "Unit 3: Realism, Regionalism, and Naturalism" },
    { id: "amerlit-modern", label: "Unit 4: Modernism to Contemporary American Voices" },
  ],
  "ap-lang": [
    { id: "aplang-rhetorical-situation", label: "Unit 1: AP Lang Unit 1 - Rhetorical Situation" },
    { id: "aplang-claims-evidence", label: "Unit 2: AP Lang Unit 2 - Claims & Evidence" },
    { id: "aplang-reasoning-organization", label: "Unit 3: AP Lang Unit 3 - Reasoning & Organization" },
    { id: "aplang-style", label: "Unit 4: AP Lang Unit 4 - Style" },
    { id: "aplang-synthesis", label: "Unit 5: AP Lang Unit 5 - Synthesis & Argument" },
  ],
  "ap-lit": [
    { id: "aplit-short-fiction", label: "Unit 1: AP Lit Unit 1 - Short Fiction" },
    { id: "aplit-poetry", label: "Unit 2: AP Lit Unit 2 - Poetry" },
    { id: "aplit-long-fiction", label: "Unit 3: AP Lit Unit 3 - Longer Fiction or Drama" },
    { id: "aplit-analysis-writing", label: "Unit 4: AP Lit Unit 4 - Literary Argument Writing" },
    { id: "aplit-theme-complexity", label: "Unit 5: AP Lit Unit 5 - Theme, Complexity, and Interpretation" },
  ],
};

const UNIT_SKILL_TAG_FILTERS: Record<string, string[]> = {
  "story-elements": ["definitions"],
  "context-clues": ["context-clues", "definitions"],
  "main-idea": ["definitions", "synonyms"],
  "text-structure": ["definitions", "context-clues"],
  "compare-contrast": ["definitions", "antonyms", "synonyms"],
  "evidence": ["context-clues", "definitions"],
  "theme-craft": ["definitions", "context-clues"],
  "figurative-language": ["definitions", "synonyms"],
  "analysis-writing": ["definitions", "context-clues", "word-forms"],
  "argument-evidence": ["definitions", "context-clues"],
  "literary-analysis": ["definitions", "synonyms"],
  "informational": ["definitions", "context-clues"],
  "rhetoric-devices": ["definitions", "context-clues"],
  "argumentation": ["definitions", "antonyms", "synonyms"],
  "precision-style": ["definitions", "word-forms", "synonyms"],
  "preap1-close-reading": ["context-clues", "definitions"],
  "preap1-evidence": ["context-clues", "definitions"],
  "preap1-claims": ["definitions", "synonyms", "antonyms"],
  "preap1-style": ["definitions", "word-forms", "synonyms"],
  "preap2-analysis": ["context-clues", "definitions"],
  "preap2-synthesis": ["context-clues", "definitions", "synonyms"],
  "preap2-argument": ["definitions", "antonyms", "synonyms"],
  "preap2-style": ["definitions", "word-forms", "synonyms"],
  "amerlit-origins": ["definitions", "context-clues"],
  "amerlit-romantic": ["definitions", "context-clues", "synonyms"],
  "amerlit-realism": ["definitions", "context-clues"],
  "amerlit-modern": ["definitions", "context-clues", "antonyms"],
  "aplang-rhetorical-situation": ["definitions", "context-clues"],
  "aplang-claims-evidence": ["definitions", "context-clues", "synonyms"],
  "aplang-reasoning-organization": ["definitions", "context-clues"],
  "aplang-style": ["definitions", "synonyms", "antonyms"],
  "aplang-synthesis": ["definitions", "context-clues", "word-forms"],
  "aplit-short-fiction": ["definitions", "context-clues"],
  "aplit-poetry": ["definitions", "synonyms", "context-clues"],
  "aplit-long-fiction": ["definitions", "context-clues"],
  "aplit-analysis-writing": ["definitions", "word-forms", "synonyms"],
  "aplit-theme-complexity": ["definitions", "context-clues", "antonyms"],
};

// ── Spaced repetition session state ──────────────────────────────────────────
interface WordState {
  question: Question;
  timesReviewed: number;   // how many times served so far
  needsReview: boolean;    // was answered incorrectly
}

type SessionPhase = "answer" | "feedback";

interface StudySession {
  tier: VocabLevel | "punctuation";
  unit: string;
  mainQueue: WordState[];       // remaining new words
  reviewQueue: WordState[];     // words to revisit
  current: WordState | null;
  sessionPhase: SessionPhase;
  lastCorrect: boolean | null;
  lastAnswerIdx: number | null;
  wordMastery: Record<string, number>;   // id → mastery pct (0-100)
  masteryDelta: Record<string, number>;  // mastery gained this session
  correct: number;
  incorrect: number;
  reviewedIds: string[];        // all word IDs seen this session
}

// ── Local mastery storage ─────────────────────────────────────────────────────
function getMasteryKey(userId: string): string {
  return `ll_mastery_${userId}`;
}

function loadLocalMastery(userId: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getMasteryKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalMastery(userId: string, mastery: Record<string, number>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getMasteryKey(userId), JSON.stringify(mastery));
}

function updateMastery(current: number, correct: boolean): number {
  if (correct) {
    // +20% on first correct, +10% thereafter, max 100%
    return Math.min(100, current + (current === 0 ? 20 : 10));
  } else {
    // -5% on wrong, min 0%
    return Math.max(0, current - 5);
  }
}

function getUnitFilteredPool(tier: VocabLevel, unit: string): Question[] {
  const pool = VOCAB_BY_LEVEL[tier] ?? [];
  const preferredTags = UNIT_SKILL_TAG_FILTERS[unit];
  if (!preferredTags) return pool;
  const filtered = pool.filter((q) => preferredTags.includes(q.skill_tag));
  // Fallback to full tier pool when the filtered slice is too small.
  if (filtered.length < 8) return pool;
  return filtered;
}

// ── Study streak helpers ─────────────────────────────────────────────────────
function getStudyStreakKey(): string { return "ll_study_streak"; }

interface LocalStudyStreak {
  streak: number;
  lastSessionDate: string | null; // ISO date string YYYY-MM-DD
}

function loadLocalStudyStreak(): LocalStudyStreak {
  if (typeof window === "undefined") return { streak: 0, lastSessionDate: null };
  try {
    const raw = localStorage.getItem(getStudyStreakKey());
    return raw ? JSON.parse(raw) : { streak: 0, lastSessionDate: null };
  } catch {
    return { streak: 0, lastSessionDate: null };
  }
}

function computeStudyStreak(current: LocalStudyStreak): LocalStudyStreak {
  const today = new Date().toISOString().slice(0, 10);
  if (!current.lastSessionDate) {
    return { streak: 1, lastSessionDate: today };
  }
  if (current.lastSessionDate === today) {
    return current; // already counted today
  }
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (current.lastSessionDate === yesterday) {
    return { streak: current.streak + 1, lastSessionDate: today };
  }
  return { streak: 1, lastSessionDate: today };
}

function saveLocalStudyStreak(data: LocalStudyStreak): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStudyStreakKey(), JSON.stringify(data));
}

const STREAK_MILESTONES: Record<number, number> = { 3: 5, 7: 15, 14: 25, 30: 50 };

// ── Page types ────────────────────────────────────────────────────────────────
type PagePhase = "tier-select" | "unit-select" | "studying" | "results";
type StudyTrack = "vocabulary" | "punctuation";

// ── Icons ─────────────────────────────────────────────────────────────────────
function BookOpenIcon({ className = "w-6 h-6", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function CheckIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function FlameIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0c0-2-1-4-2-5 0 2-1 3-3 3s-2-2-2-4c0-2 2-5 2-5z" opacity="0.85"/>
      <path d="M12 22a4 4 0 0 1-4-4c0-2 2-4 4-4s4 2 4 4a4 4 0 0 1-4 4z" opacity="0.6"/>
    </svg>
  );
}

function ArrowLeftIcon({ className = "w-5 h-5", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

// ── Mastery bar component ────────────────────────────────────────────────────
function MasteryBar({ pct, label, light }: { pct: number; label?: string; light: boolean }) {
  const barColor = pct >= 80 ? MINT : pct >= 50 ? BLUE : "#F59E0B";
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs mb-1">
          <span className={light ? "text-[#64748B]" : "text-white/50"}>{label}</span>
          <span className="font-bold" style={{ color: barColor }}>{pct}% mastery</span>
        </div>
      )}
      <div className={`w-full h-2 rounded-full overflow-hidden ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StudyPage() {
  const { user } = useAuth();
  const { light } = useTheme();

  const [phase, setPhase] = useState<PagePhase>("tier-select");
  const [selectedTrack, setSelectedTrack] = useState<StudyTrack>("vocabulary");
  const [selectedTier, setSelectedTier] = useState<VocabLevel | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [session, setSession] = useState<StudySession | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [studyStreak, setStudyStreak] = useState(0);
  const [sessionRewards, setSessionRewards] = useState<{ xp: number; drops: number; streakBonus: number } | null>(null);

  useEffect(() => {
    const p = getProfile() ?? createGuestProfile();
    setProfile(p);
    const streak = loadLocalStudyStreak();
    setStudyStreak(streak.streak);
  }, []);

  // ── Theme tokens ────────────────────────────────────────────────────────────
  const bg = light ? "bg-[#F8FAFC]" : "";
  const text = light ? "text-[#0F172A]" : "text-white";
  const textMuted = light ? "text-[#64748B]" : "text-white/60";
  const textFaint = light ? "text-[#94A3B8]" : "text-white/40";
  const cardBg = light ? "bg-white" : "bg-[#1E293B]/60";
  const cardBorder = light ? "border-[#E2E8F0]" : "border-white/10";
  const headerBtn = light ? "bg-[#F1F5F9] border-[#E2E8F0]" : "bg-white/5 border-white/10";

  // ── Start session ───────────────────────────────────────────────────────────
  const startSession = useCallback((tier: VocabLevel, unit: string) => {
    const pool = getUnitFilteredPool(tier, unit);
    // Pick up to SESSION_QUESTION_COUNT questions shuffled
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, SESSION_QUESTION_COUNT);
    const userId = user?.id ?? "guest";
    const localMastery = loadLocalMastery(userId);

    const queue: WordState[] = shuffled.map((q) => ({
      question: q,
      timesReviewed: 0,
      needsReview: false,
    }));

    const wordMastery: Record<string, number> = {};
    for (const ws of queue) {
      wordMastery[ws.question.id] = localMastery[ws.question.id] ?? 0;
    }

    const first = queue[0] ?? null;

    setSession({
      tier,
      unit,
      mainQueue: queue.slice(1),
      reviewQueue: [],
      current: first,
      sessionPhase: "answer",
      lastCorrect: null,
      lastAnswerIdx: null,
      wordMastery,
      masteryDelta: {},
      correct: 0,
      incorrect: 0,
      reviewedIds: first ? [first.question.id] : [],
    });
    setPhase("studying");
  }, [user]);

  const startPunctuationSession = useCallback((moduleId: string) => {
    const pool = getPunctuationQuestionsByModule(moduleId, SESSION_QUESTION_COUNT);
    const userId = user?.id ?? "guest";
    const localMastery = loadLocalMastery(userId);
    const queue: WordState[] = pool.map((q) => ({
      question: q,
      timesReviewed: 0,
      needsReview: false,
    }));

    const wordMastery: Record<string, number> = {};
    for (const ws of queue) {
      wordMastery[ws.question.id] = localMastery[ws.question.id] ?? 0;
    }

    const first = queue[0] ?? null;

    setSession({
      tier: "punctuation",
      unit: moduleId,
      mainQueue: queue.slice(1),
      reviewQueue: [],
      current: first,
      sessionPhase: "answer",
      lastCorrect: null,
      lastAnswerIdx: null,
      wordMastery,
      masteryDelta: {},
      correct: 0,
      incorrect: 0,
      reviewedIds: first ? [first.question.id] : [],
    });
    setPhase("studying");
  }, [user]);

  // ── Handle answer ────────────────────────────────────────────────────────────
  const handleAnswer = useCallback((answerIdx: number) => {
    if (!session || !session.current || session.sessionPhase !== "answer") return;

    const q = session.current.question;
    const correct = answerIdx === q.answer_index;
    const prevMastery = session.wordMastery[q.id] ?? 0;
    const newMastery = updateMastery(prevMastery, correct);
    const delta = newMastery - prevMastery;

    setSession((prev) => {
      if (!prev || !prev.current) return prev;
      return {
        ...prev,
        sessionPhase: "feedback",
        lastCorrect: correct,
        lastAnswerIdx: answerIdx,
        wordMastery: { ...prev.wordMastery, [q.id]: newMastery },
        masteryDelta: {
          ...prev.masteryDelta,
          [q.id]: (prev.masteryDelta[q.id] ?? 0) + delta,
        },
        correct: correct ? prev.correct + 1 : prev.correct,
        incorrect: correct ? prev.incorrect : prev.incorrect + 1,
        current: { ...prev.current, needsReview: !correct, timesReviewed: prev.current.timesReviewed + 1 },
      };
    });
  }, [session]);

  // ── Advance to next question ─────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (!session) return;

    setSession((prev) => {
      if (!prev) return prev;
      const { mainQueue, reviewQueue, current } = prev;

      // If the current word was wrong, add to review queue (served once more later)
      const newReviewQueue = current?.needsReview
        ? [...reviewQueue, { ...current, needsReview: false }]
        : reviewQueue;

      let nextWord: WordState | null = null;
      let newMain = mainQueue;
      let newReview = newReviewQueue;

      // Every 2 new words, serve a review word if available
      const shouldServeReview =
        newReviewQueue.length > 0 &&
        (mainQueue.length === 0 || prev.correct % 3 === 2);

      if (shouldServeReview) {
        nextWord = newReview[0];
        newReview = newReview.slice(1);
      } else if (newMain.length > 0) {
        nextWord = newMain[0];
        newMain = newMain.slice(1);
      } else if (newReview.length > 0) {
        nextWord = newReview[0];
        newReview = newReview.slice(1);
      }

      return {
        ...prev,
        mainQueue: newMain,
        reviewQueue: newReview,
        current: nextWord,
        sessionPhase: "answer",
        lastCorrect: null,
        lastAnswerIdx: null,
        reviewedIds: nextWord
          ? [...new Set([...prev.reviewedIds, nextWord.question.id])]
          : prev.reviewedIds,
      };
    });
  }, [session]);

  // ── End session (when no more words) ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== "studying" || !session) return;
    if (session.current !== null) return;
    if (session.mainQueue.length > 0 || session.reviewQueue.length > 0) return;

    // Session complete — award XP and Ink Drops
    const xpGained = session.correct * STUDY_XP_PER_CORRECT;
    const dropsGained = session.correct * STUDY_DROPS_PER_CORRECT;

    // Update study streak (local)
    const currentStreak = loadLocalStudyStreak();
    const newStreak = computeStudyStreak(currentStreak);
    saveLocalStudyStreak(newStreak);
    const streakBonus = newStreak.streak > currentStreak.streak
      ? (STREAK_MILESTONES[newStreak.streak] ?? 0)
      : 0;
    setStudyStreak(newStreak.streak);

    // Persist mastery locally
    const userId = user?.id ?? "guest";
    const existing = loadLocalMastery(userId);
    const updated = { ...existing, ...session.wordMastery };
    saveLocalMastery(userId, updated);

    // Update profile XP/drops
    const p = getProfile() ?? createGuestProfile();
    const updatedProfile = {
      ...p,
      xp: (p.xp ?? 0) + xpGained,
      ink_drops: (p.ink_drops ?? 0) + dropsGained + streakBonus,
      study_streak: newStreak.streak,
      last_study_session_at: new Date().toISOString(),
    };
    saveProfile(updatedProfile);
    setProfile(updatedProfile);

    // Sync to Supabase if logged in
    if (user?.id) {
      const supabase = createClient();
      // Upsert profile progress
      supabase.from("profiles").update({
        xp: updatedProfile.xp,
        ink_drops: updatedProfile.ink_drops,
        study_streak: newStreak.streak,
        last_study_session_at: updatedProfile.last_study_session_at,
        updated_at: new Date().toISOString(),
      }).eq("id", user.id).then(() => {});

      // Upsert word mastery for each word studied
      for (const [wordId, masteryPct] of Object.entries(session.wordMastery)) {
        supabase.from("word_mastery").upsert({
          user_id: user.id,
          word_id: wordId,
          tier: String(session.tier),
          unit: session.unit,
          mastery_pct: masteryPct,
          last_seen_at: new Date().toISOString(),
        }, { onConflict: "user_id,word_id" }).then(() => {});
      }
    }

    setSessionRewards({ xp: xpGained, drops: dropsGained + streakBonus, streakBonus });
    setPhase("results");
  }, [phase, session, user]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <main className={`min-h-[100dvh] ${bg} ${text} flex flex-col overflow-x-hidden`} style={!light ? { background: SURFACE } : undefined}>
      {/* Header */}
      <header className={`flex items-center justify-between gap-3 px-4 sm:px-6 py-4 max-w-3xl mx-auto w-full border-b ${cardBorder}`}>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className={`flex items-center justify-center w-9 h-9 rounded-xl ${headerBtn} border transition-colors`}>
            <ArrowLeftIcon className="w-4 h-4" color={light ? "#64748B" : "rgba(255,255,255,0.6)"} />
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2">
            <LogoIcon className="w-7 h-7" />
            <span className={`text-base font-bold ${text}`}>Study Mode</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          {studyStreak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#F97316" + "20" }}>
              <FlameIcon className="w-4 h-4" color="#F97316" />
              <span className="text-sm font-bold" style={{ color: "#F97316" }}>{studyStreak}</span>
            </div>
          )}
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-6">

        {/* ── TIER SELECT ──────────────────────────────────────────────────── */}
        {phase === "tier-select" && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className={`text-2xl font-bold ${text}`}>Choose your track</h1>
              <p className={`text-sm mt-1 ${textMuted}`}>Study vocabulary tiers or punctuation curriculum modules.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTrack("vocabulary")}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border ${selectedTrack === "vocabulary" ? "text-white" : (light ? "text-[#64748B]" : "text-white/60")}`}
                style={selectedTrack === "vocabulary" ? { backgroundColor: BLUE, borderColor: BLUE } : undefined}
              >
                Vocabulary
              </button>
              <button
                onClick={() => setSelectedTrack("punctuation")}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border ${selectedTrack === "punctuation" ? "text-white" : (light ? "text-[#64748B]" : "text-white/60")}`}
                style={selectedTrack === "punctuation" ? { backgroundColor: BLUE, borderColor: BLUE } : undefined}
              >
                Punctuation
              </button>
            </div>

            {selectedTrack === "vocabulary" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_TIERS.map((tier) => {
                  const label = VOCAB_LEVEL_LABELS[tier];
                  const desc = TIER_DESCRIPTIONS[tier];
                  const diff = TIER_DIFFICULTY[tier];
                  const diffColor = DIFFICULTY_COLOR[diff];
                  const isHS = typeof tier === "string";

                  return (
                    <button
                      key={String(tier)}
                      onClick={() => { setSelectedTier(tier); setSelectedUnit(null); setPhase("unit-select"); }}
                      className={`text-left rounded-xl p-4 ${cardBg} border ${cardBorder} transition-all hover:border-[${BLUE}]/40 hover:shadow-md active:scale-[0.98] group`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={`font-bold text-base ${text}`}>{label}</span>
                        <div className="flex flex-col items-end gap-1">
                          {isHS && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${light ? "bg-[#F1F5F9] text-[#64748B]" : "bg-white/10 text-white/50"}`}>
                              High School
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: diffColor + "20", color: diffColor }}>
                            {diff}
                          </span>
                        </div>
                      </div>
                      <p className={`text-xs ${textMuted} line-clamp-2`}>{desc}</p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {PUNCTUATION_CURRICULUM_MODULES.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => {
                      setSelectedTier(null);
                      setSelectedUnit(module.id);
                      startPunctuationSession(module.id);
                    }}
                    className={`text-left rounded-xl p-4 ${cardBg} border ${cardBorder} transition-all hover:border-[${BLUE}]/40 hover:shadow-md active:scale-[0.98]`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`font-bold ${text}`}>{module.title}</p>
                        <p className={`text-xs mt-1 ${textMuted}`}>{module.summary}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${light ? "bg-[#F1F5F9] text-[#64748B]" : "bg-white/10 text-white/50"}`}>
                          {module.pathway}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: BLUE + "20", color: BLUE }}>
                          Level {module.punctuationLevel}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── UNIT SELECT ──────────────────────────────────────────────────── */}
        {phase === "unit-select" && selectedTier !== null && selectedTrack === "vocabulary" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPhase("tier-select")}
                className={`flex items-center justify-center w-8 h-8 rounded-lg ${headerBtn} border`}
              >
                <ArrowLeftIcon className="w-4 h-4" color={light ? "#64748B" : "rgba(255,255,255,0.6)"} />
              </button>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wide ${textFaint}`}>Tier</p>
                <h2 className={`text-xl font-bold ${text}`}>{VOCAB_LEVEL_LABELS[selectedTier]}</h2>
              </div>
            </div>

            <div>
              <p className={`text-sm mb-4 ${textMuted}`}>Select a unit to study. All units are self-paced with spaced repetition.</p>
              <div className="flex flex-col gap-3">
                {TIER_UNITS[selectedTier].map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => { setSelectedUnit(unit.id); startSession(selectedTier, unit.id); }}
                    className={`text-left rounded-xl p-5 ${cardBg} border ${cardBorder} transition-all hover:border-[${BLUE}]/40 hover:shadow-md active:scale-[0.98] flex items-center gap-4`}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: BLUE + "20" }}>
                      <BookOpenIcon className="w-5 h-5" color={BLUE} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold ${text}`}>{unit.label}</p>
                      <p className={`text-xs ${textMuted} mt-0.5`}>Self-paced · Spaced repetition · Untimed</p>
                    </div>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={light ? "#94A3B8" : "rgba(255,255,255,0.3)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div className={`rounded-xl p-4 ${light ? "bg-[#F0FDF4] border border-[#BBF7D0]" : "bg-[#34D399]/10 border border-[#34D399]/20"}`}>
              <p className={`text-xs font-semibold mb-1`} style={{ color: MINT }}>How Study Mode works</p>
              <ul className={`text-xs ${textMuted} space-y-1`}>
                <li>• Answer at your own pace — no timer, no pressure.</li>
                <li>• Words you miss come back later in the session.</li>
                <li>• Mastery builds over multiple sessions.</li>
                <li>• Earn XP and Ink Drops for every word you get right.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── STUDYING ─────────────────────────────────────────────────────── */}
        {phase === "studying" && session && session.current && (
          <StudyQuestion
            session={session}
            light={light}
            text={text}
            textMuted={textMuted}
            textFaint={textFaint}
            cardBg={cardBg}
            cardBorder={cardBorder}
            onAnswer={handleAnswer}
            onNext={handleNext}
            sessionLabel={
              session.tier === "punctuation"
                ? (PUNCTUATION_CURRICULUM_MODULES.find((m) => m.id === session.unit)?.title ?? "Punctuation")
                : VOCAB_LEVEL_LABELS[selectedTier!]
            }
          />
        )}

        {/* ── RESULTS ──────────────────────────────────────────────────────── */}
        {phase === "results" && session && sessionRewards && (
          <StudyResults
            session={session}
            rewards={sessionRewards}
            studyStreak={studyStreak}
            light={light}
            text={text}
            textMuted={textMuted}
            textFaint={textFaint}
            cardBg={cardBg}
            cardBorder={cardBorder}
            sessionLabel={
              session.tier === "punctuation"
                ? (PUNCTUATION_CURRICULUM_MODULES.find((m) => m.id === session.unit)?.title ?? "Punctuation")
                : (selectedTier ? VOCAB_LEVEL_LABELS[selectedTier] : "Punctuation")
            }
            selectedUnit={selectedUnit!}
            onStudyAgain={() => {
              if (session.tier === "punctuation" && selectedUnit) {
                startPunctuationSession(selectedUnit);
              } else if (selectedTier && selectedUnit) {
                startSession(selectedTier, selectedUnit);
              }
            }}
            onChangeTier={() => {
              setSelectedTier(null);
              setSelectedUnit(null);
              setSession(null);
              setSessionRewards(null);
              setSelectedTrack("vocabulary");
              setPhase("tier-select");
            }}
          />
        )}
      </div>
    </main>
  );
}

// ── Study question sub-component ──────────────────────────────────────────────
function StudyQuestion({
  session,
  light,
  text,
  textMuted,
  textFaint,
  cardBg,
  cardBorder,
  onAnswer,
  onNext,
  sessionLabel,
}: {
  session: StudySession;
  light: boolean;
  text: string;
  textMuted: string;
  textFaint: string;
  cardBg: string;
  cardBorder: string;
  onAnswer: (idx: number) => void;
  onNext: () => void;
  sessionLabel: string;
}) {
  const q = session.current!.question;
  const mastery = session.wordMastery[q.id] ?? 0;
  const totalRemaining = session.mainQueue.length + session.reviewQueue.length + 1;
  const totalWords = session.reviewedIds.length + (totalRemaining - 1);
  const progress = totalWords > 0 ? ((session.reviewedIds.length) / (session.reviewedIds.length + totalRemaining)) * 100 : 0;

  const isFeedback = session.sessionPhase === "feedback";
  const lastCorrect = session.lastCorrect;
  const lastAnswerIdx = session.lastAnswerIdx;

  const choiceStyles = q.choices.map((_, idx) => {
    if (!isFeedback) {
      return `${light ? "bg-white border-[#E2E8F0] hover:border-[${BLUE}]/60 hover:bg-[${BLUE}]/5" : "bg-[#1E293B]/60 border-white/10 hover:border-[#3B82F6]/40 hover:bg-white/5"} cursor-pointer active:scale-[0.98]`;
    }
    if (idx === q.answer_index) return "border-[#34D399] bg-[#34D399]/10 cursor-default";
    if (idx === lastAnswerIdx && idx !== q.answer_index) return "border-[#EF4444] bg-[#EF4444]/10 cursor-default";
    return `${light ? "border-[#E2E8F0] bg-[#F8FAFC]" : "border-white/10 bg-[#1E293B]/40"} opacity-50 cursor-default`;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Progress header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1.5">
            <span className={textFaint}>{sessionLabel}</span>
            <span className={textFaint}>{session.reviewedIds.length} / {session.reviewedIds.length + totalRemaining} words</span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${light ? "bg-[#E2E8F0]" : "bg-white/10"}`}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: BLUE }} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold" style={{ color: "#34D399" }}>{session.correct}</span>
          <span className={`text-sm ${textFaint}`}>/</span>
          <span className="text-sm" style={{ color: "#EF4444" }}>{session.incorrect}</span>
        </div>
      </div>

      {/* Mastery bar for current word */}
      <MasteryBar pct={mastery} label="Item mastery" light={light} />

      {/* Question card */}
      <div className={`rounded-2xl p-6 ${cardBg} border ${cardBorder}`}>
        {/* Skill tag */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${light ? "bg-[#F1F5F9] text-[#64748B]" : "bg-white/10 text-white/50"}`}>
            {q.skill_tag.replace("-", " ")}
          </span>
        </div>

        <p className={`text-lg font-semibold leading-snug ${text} mb-6`}>{q.prompt}</p>

        <div className="flex flex-col gap-3">
          {q.choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => !isFeedback && onAnswer(idx)}
              disabled={isFeedback}
              className={`w-full text-left rounded-xl px-4 py-3.5 border text-sm font-medium transition-all ${choiceStyles[idx]} ${light ? "text-[#0F172A]" : "text-white"}`}
            >
              <span className={isFeedback && idx === q.answer_index ? "font-bold" : ""} style={{ color: isFeedback && idx === q.answer_index ? "#34D399" : undefined }}>
                {choice}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {isFeedback && (
        <div className={`rounded-xl p-4 border ${lastCorrect ? "border-[#34D399]/40 bg-[#34D399]/10" : "border-[#EF4444]/40 bg-[#EF4444]/10"}`}>
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${lastCorrect ? "bg-[#34D399]" : "bg-[#EF4444]"}`}>
              {lastCorrect ? <CheckIcon className="w-4 h-4" color="white" /> : <XIcon className="w-4 h-4" color="white" />}
            </div>
            <div className="flex-1 min-w-0">
              {lastCorrect ? (
                <p className="text-sm font-bold" style={{ color: "#34D399" }}>Correct! Keep it up.</p>
              ) : (
                <>
                  <p className="text-sm font-bold" style={{ color: "#EF4444" }}>
                    The correct answer is: <span className="font-extrabold">{q.choices[q.answer_index]}</span>
                  </p>
                  <p className={`text-xs mt-1 ${light ? "text-[#64748B]" : "text-white/60"}`}>
                    This word will come back again so you can practice it.
                  </p>
                </>
              )}
              {/* Mastery update */}
              <p className={`text-xs mt-1.5 ${light ? "text-[#94A3B8]" : "text-white/40"}`}>
                {lastCorrect
                  ? `+${updateMastery(mastery, true) - mastery}%`
                  : `-${Math.min(5, mastery)}%`} mastery on this word
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next button */}
      {isFeedback && (
        <button
          onClick={onNext}
          className="w-full py-4 rounded-xl text-white font-bold text-base transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: BLUE }}
        >
          {session.mainQueue.length === 0 && session.reviewQueue.length === 0 ? "Finish session" : "Next word →"}
        </button>
      )}
    </div>
  );
}

// ── Results sub-component ─────────────────────────────────────────────────────
function StudyResults({
  session,
  rewards,
  studyStreak,
  light,
  text,
  textMuted,
  textFaint,
  cardBg,
  cardBorder,
  sessionLabel,
  selectedUnit,
  onStudyAgain,
  onChangeTier,
}: {
  session: StudySession;
  rewards: { xp: number; drops: number; streakBonus: number };
  studyStreak: number;
  light: boolean;
  text: string;
  textMuted: string;
  textFaint: string;
  cardBg: string;
  cardBorder: string;
  sessionLabel: string;
  selectedUnit: string;
  onStudyAgain: () => void;
  onChangeTier: () => void;
}) {
  const accuracy = session.correct + session.incorrect > 0
    ? Math.round((session.correct / (session.correct + session.incorrect)) * 100)
    : 0;

  // Words with mastery gains
  const improvedWords = Object.entries(session.masteryDelta)
    .filter(([, delta]) => delta > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="text-center py-4">
        <div className="flex justify-center mb-3">
          <InkAvatar config={{ base: "droplet_01", color: BLUE, eyes: "eyes_03", accessory: "none", aura: "none" }} size={72} />
        </div>
        <h2 className={`text-2xl font-bold ${text}`}>Session complete!</h2>
        <p className={`text-sm ${textMuted} mt-1`}>{sessionLabel} · {session.reviewedIds.length} words reviewed</p>
      </div>

      {/* Streak badge */}
      {studyStreak > 0 && (
        <div className={`flex items-center gap-3 rounded-xl p-4 ${light ? "bg-[#FFF7ED] border border-[#FED7AA]" : "bg-[#F97316]/10 border border-[#F97316]/20"}`}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#F97316" }}>
            <FlameIcon className="w-5 h-5" color="white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: "#F97316" }}>{studyStreak}-day study streak!</p>
            {rewards.streakBonus > 0 && (
              <p className="text-xs" style={{ color: "#F97316" }}>+{rewards.streakBonus} bonus Ink Drops earned</p>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className={`rounded-xl p-5 ${cardBg} border ${cardBorder}`}>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Correct", value: session.correct, color: "#34D399" },
            { label: "Accuracy", value: `${accuracy}%`, color: BLUE },
            { label: "Reviewed", value: session.reviewedIds.length, color: "#A78BFA" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
              <p className={`text-xs ${textFaint}`}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rewards */}
      <div className={`rounded-xl p-5 ${cardBg} border ${cardBorder}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide ${textFaint} mb-3`}>Rewards earned</p>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <SparkIcon className="w-5 h-5" color={BLUE} />
            <div>
              <p className="font-bold text-base" style={{ color: BLUE }}>+{rewards.xp} XP</p>
              <p className={`text-xs ${textFaint}`}>Experience</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <InkDropIcon className="w-5 h-5" color={MINT} />
            <div>
              <p className="font-bold text-base" style={{ color: MINT }}>+{rewards.drops} Drops</p>
              <p className={`text-xs ${textFaint}`}>Ink Drops</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mastery improvements */}
      {improvedWords.length > 0 && (
        <div className={`rounded-xl p-5 ${cardBg} border ${cardBorder}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${textFaint} mb-3`}>Mastery gains</p>
          <div className="flex flex-col gap-3">
            {improvedWords.slice(0, 6).map(([wordId, delta]) => {
              const allQuestions = [...Object.values(VOCAB_BY_LEVEL).flat(), ...PUNCTUATION_QUESTIONS];
              const q = allQuestions.find((w) => w.id === wordId);
              const mastery = session.wordMastery[wordId] ?? 0;
              if (!q) return null;
              // Extract the word from the prompt
              const wordMatch = q.prompt.match(/'([^']+)'/);
              const wordLabel = wordMatch ? wordMatch[1] : wordId;
              return (
                <div key={wordId}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={`font-medium ${light ? "text-[#0F172A]" : "text-white"}`}>
                      {wordLabel}
                    </span>
                    <span className="font-bold" style={{ color: MINT }}>+{delta}%</span>
                  </div>
                  <MasteryBar pct={mastery} light={light} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 pb-6">
        <button
          onClick={onStudyAgain}
          className="w-full py-4 rounded-xl text-white font-bold text-base transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: BLUE }}
        >
          Study again
        </button>
        <button
          onClick={onChangeTier}
          className={`w-full py-3.5 rounded-xl font-bold text-sm border transition-colors ${light ? "border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]" : "border-white/10 text-white/60 hover:text-white"}`}
        >
          Choose different tier
        </button>
        <Link href="/dashboard" className={`w-full py-3.5 rounded-xl font-bold text-sm text-center border transition-colors ${light ? "border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A]" : "border-white/10 text-white/60 hover:text-white"}`}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
