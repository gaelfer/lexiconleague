import type { Question, VocabLevel } from '@/types';

// ── Chapter definitions ──────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ChapterDef {
  id: number;
  title: string;
  region: string;
  regionIndex: 0 | 1 | 2 | 3;
  /** Grade level used to select questions for this chapter */
  questionLevel: VocabLevel;
  /** Short flavour text shown on the world map card */
  teaser: string;
  /** Whether this chapter has a boss fight */
  hasBoss: boolean;
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: 1,
    title: 'Inkwell Village',
    region: 'Inkwell Village',
    regionIndex: 0,
    questionLevel: 3,
    teaser: 'The corruption begins. Your companion runs.',
    hasBoss: false,
  },
  {
    id: 2,
    title: 'Village Square',
    region: 'Inkwell Village',
    regionIndex: 0,
    questionLevel: 3,
    teaser: 'Rescue your companion from the corrupted inkling.',
    hasBoss: true,
  },
  {
    id: 3,
    title: 'Forest Edge',
    region: 'Wordwood Forest',
    regionIndex: 1,
    questionLevel: 4,
    teaser: 'Words carved into bark pulse with energy.',
    hasBoss: false,
  },
  {
    id: 4,
    title: 'Ink River',
    region: 'Wordwood Forest',
    regionIndex: 1,
    questionLevel: 4,
    teaser: 'A flash of red in the trees.',
    hasBoss: false,
  },
  {
    id: 5,
    title: 'Heart of the Forest',
    region: 'Wordwood Forest',
    regionIndex: 1,
    questionLevel: 5,
    teaser: 'The forest guardian awakens.',
    hasBoss: true,
  },
  {
    id: 6,
    title: 'Ancient Approach',
    region: 'Forgotten Ruins',
    regionIndex: 2,
    questionLevel: 5,
    teaser: 'Language built civilisations here.',
    hasBoss: false,
  },
  {
    id: 7,
    title: 'The Trap',
    region: 'Forgotten Ruins',
    regionIndex: 2,
    questionLevel: 6,
    teaser: 'A trap springs. You are alone.',
    hasBoss: false,
  },
  {
    id: 8,
    title: 'The Guardian',
    region: 'Forgotten Ruins',
    regionIndex: 2,
    questionLevel: 6,
    teaser: '"You\'re closer than you think."',
    hasBoss: true,
  },
  {
    id: 9,
    title: 'Shadow Fortress',
    region: 'Shadow Fortress',
    regionIndex: 3,
    questionLevel: 7,
    teaser: 'His voice echoes. He hides.',
    hasBoss: true,
  },
  {
    id: 10,
    title: 'The Red Inkling',
    region: 'Shadow Fortress',
    regionIndex: 3,
    questionLevel: 'ap-lang',
    teaser: 'The final confrontation.',
    hasBoss: true,
  },
];

export function getChapter(id: number): ChapterDef | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

// ── Question pool per chapter ────────────────────────────────────────────────

/**
 * Returns the vocabulary questions appropriate for a given chapter.
 * Uses the existing question bank in lib/game/questions.ts.
 */
export function getChapterQuestions(chapterId: number): Question[] {
  const chapter = getChapter(chapterId);
  if (!chapter) return [];

  // Lazy-require to keep this module SSR-safe
  // (questions.ts is imported server-side too, but it's fine — no DOM usage)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getSeededQuestionsForMode } = require('@/lib/game/questions') as {
    getSeededQuestionsForMode: (
      subject: 'vocabulary' | 'punctuation',
      seed: string,
      count?: number,
      vocabGrade?: VocabLevel,
    ) => Question[];
  };

  return getSeededQuestionsForMode(
    'vocabulary',
    String(chapterId * 1000),
    30,
    chapter.questionLevel,
  );
}

// ── Region metadata ──────────────────────────────────────────────────────────

export const REGIONS = [
  {
    index: 0,
    name: 'Inkwell Village',
    chapters: [1, 2],
    color: '#34d399',
    vibe: 'Cozy, safe, familiar.',
    unlocked: true,
  },
  {
    index: 1,
    name: 'Wordwood Forest',
    chapters: [3, 4, 5],
    color: '#4ade80',
    vibe: 'Lush but eerie.',
    unlocked: false,
  },
  {
    index: 2,
    name: 'Forgotten Ruins',
    chapters: [6, 7, 8],
    color: '#a78bfa',
    vibe: 'Ancient, awe-inspiring.',
    unlocked: false,
  },
  {
    index: 3,
    name: 'Shadow Fortress',
    chapters: [9, 10],
    color: '#f87171',
    vibe: 'Dark, imposing.',
    unlocked: false,
  },
] as const;
