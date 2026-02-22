const PROGRESS_KEY = 'lexiconleague:story:progress';
const INVENTORY_KEY = 'lexiconleague:story:inventory';

// ── Types ────────────────────────────────────────────────────────────────────

export interface StoryProgress {
  playerName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  currentChapter: number;
  completedChapters: number[];
  /** Maps chapterId → checkpoint room key (e.g. "room_1") */
  chapterCheckpoints: Record<number, string>;
  unlockedLore: string[];
  claimedRewards: string[];
}

export interface StoryInventory {
  lexicoins: number;
  equippedWeapon: 'sword' | 'bow' | 'shield';
  unlockedWeapons: string[];
  /** itemId → quantity */
  consumables: Record<string, number>;
  keyItems: string[];
  purchasedUpgrades: string[];
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PROGRESS: StoryProgress = {
  playerName: 'Hero',
  difficulty: 'medium',
  currentChapter: 1,
  completedChapters: [],
  chapterCheckpoints: {},
  unlockedLore: [],
  claimedRewards: [],
};

const DEFAULT_INVENTORY: StoryInventory = {
  lexicoins: 0,
  equippedWeapon: 'sword',
  unlockedWeapons: ['sword'],
  consumables: {},
  keyItems: [],
  purchasedUpgrades: [],
};

// ── Read / write ─────────────────────────────────────────────────────────────

export function getStoryProgress(): StoryProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveStoryProgress(progress: Partial<StoryProgress>): void {
  try {
    const current = getStoryProgress();
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...current, ...progress }));
  } catch {
    // localStorage unavailable (e.g. private browsing quota exceeded)
  }
}

export function getStoryInventory(): StoryInventory {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY);
    if (!raw) return { ...DEFAULT_INVENTORY };
    return { ...DEFAULT_INVENTORY, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_INVENTORY };
  }
}

export function saveStoryInventory(inventory: Partial<StoryInventory>): void {
  try {
    const current = getStoryInventory();
    localStorage.setItem(INVENTORY_KEY, JSON.stringify({ ...current, ...inventory }));
  } catch {}
}

// ── Convenience helpers ──────────────────────────────────────────────────────

export function markChapterComplete(chapterId: number): void {
  const p = getStoryProgress();
  if (!p.completedChapters.includes(chapterId)) {
    p.completedChapters.push(chapterId);
  }
  p.currentChapter = Math.max(p.currentChapter, chapterId + 1);
  saveStoryProgress(p);
}

export function isChapterUnlocked(chapterId: number): boolean {
  if (chapterId === 1) return true;
  const p = getStoryProgress();
  return p.completedChapters.includes(chapterId - 1);
}

export function resetStoryProgress(): void {
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(INVENTORY_KEY);
}
