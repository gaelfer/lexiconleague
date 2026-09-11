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
  /** Absent on legacy saves, which retain their existing access. */
  opening?: 'woke' | 'chase' | 'scholar' | 'wordwood';
  defeatedRoadEnemies?: number[];
  visitedInkwell?: boolean;
  innRoomBooked?: boolean;
  startedAt?: number;
  savedAt?: number;
  resumeArea?: 'road'|'village'|'wordwood';
  trackedQuest?: string;
  trackedMainQuest?: string|null;
  trackedSideQuests?: string[];
  questOverlayVisible?: boolean;
  learnedSkills?: ('spin'|'focused-spin'|'wide-spin')[];
  quests?: Record<string,{status:'active'|'completed';steps:string[]}>;
  wordwoodExpedition?: {
    drained?: boolean; key?: boolean; seal?: boolean; tablet?: boolean; studied?: boolean; checkpoint?: boolean;
    maintenance?: boolean; gallery?: boolean; store?: boolean;
    herbsUsed?: number;
    gardenGateKey?: boolean;
    gardenGateOpened?: boolean;
    repositoryKeyUsed?: boolean;
    logGuardianFreed?: boolean;
    cleared?: string[];
  };
}

export interface StoryInventory {
  lexicoins: number;
  equippedWeapon: 'sword' | 'bow' | 'shield';
  unlockedWeapons: string[];
  /** Missing in older saves: both existing tools remain ready to use. Empty means unequipped. */
  equippedGear?: ('sword'|'bow')[];
  toolSlots?: {Q:'sword'|'bow'|null;R:'sword'|'bow'|null;F:'sword'|'bow'|null};
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

function saveNotice(ok:boolean){
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('story-save',{detail:{ok}}));
}

export function saveStoryProgress(progress: Partial<StoryProgress>): boolean {
  try {
    const current = getStoryProgress();
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...current, ...progress,savedAt:Date.now() }));
    saveNotice(true);return true;
  } catch {
    saveNotice(false);return false;
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

export function saveStoryInventory(inventory: Partial<StoryInventory>): boolean {
  try {
    const current = getStoryInventory();
    localStorage.setItem(INVENTORY_KEY, JSON.stringify({ ...current, ...inventory }));
    return saveStoryProgress({});
  } catch {saveNotice(false);return false;}
}

// ── Convenience helpers ──────────────────────────────────────────────────────

export function markChapterComplete(chapterId: number): void {
  const p = getStoryProgress();
  if (!p.completedChapters.includes(chapterId)) {
    p.completedChapters = [...p.completedChapters, chapterId];
  }
  p.currentChapter = Math.max(p.currentChapter, chapterId + 1);
  saveStoryProgress(p);
}

export function isChapterUnlocked(chapterId: number): boolean {
  if (chapterId === 1) return true;
  const p = getStoryProgress();
  if (chapterId === 2 && p.opening && p.opening !== 'wordwood' && !p.completedChapters.includes(2)) return false;
  return p.completedChapters.includes(chapterId - 1);
}

export function resetStoryProgress(): void {
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(INVENTORY_KEY);
}
