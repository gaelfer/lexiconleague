/**
 * Level system based on total XP.
 * Gentle curve: early levels are quick (L2=50, L3=150, L4=300...), scales up gradually.
 * Cosmetics and rewards can be gated by level later.
 */

/** Total XP required to reach a given level (level 1 = 0) */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  // 25 * level * (level - 1) → L2=50, L3=150, L4=300, L5=500, L6=750, L10=2250
  return Math.floor(25 * level * (level - 1));
}

/** Current level from total XP */
export function getLevel(xp: number): number {
  if (xp < 0) return 1;
  let level = 1;
  while (getXPForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}

export interface LevelProgress {
  level: number;
  xpInLevel: number;
  xpNeededForLevel: number;
  progressPercent: number;
}

export interface LevelReward {
  level: number;
  label: string;
  type: "ink_drops" | "cosmetic" | "title" | "badge";
  amount?: number;
  itemId?: string;
}

export const LEVEL_REWARDS: LevelReward[] = [
  { level: 2,  label: "10 Ink Drops",        type: "ink_drops", amount: 10 },
  { level: 3,  label: "25 Ink Drops",        type: "ink_drops", amount: 25 },
  { level: 4,  label: "50 Ink Drops",        type: "ink_drops", amount: 50 },
  { level: 5,  label: "75 Ink Drops",        type: "ink_drops", amount: 75 },
  { level: 7,  label: "100 Ink Drops",       type: "ink_drops", amount: 100 },
  { level: 9,  label: "150 Ink Drops",       type: "ink_drops", amount: 150 },
  { level: 10, label: "200 Ink Drops",       type: "ink_drops", amount: 200 },
  { level: 12, label: "300 Ink Drops",       type: "ink_drops", amount: 300 },
  { level: 15, label: "450 Ink Drops",       type: "ink_drops", amount: 450 },
  { level: 18, label: "500 Ink Drops",       type: "ink_drops", amount: 500 },
  { level: 20, label: "Word Warrior Title",  type: "title" },
  { level: 22, label: "600 Ink Drops",       type: "ink_drops", amount: 600 },
  { level: 25, label: "750 Ink Drops",       type: "ink_drops", amount: 750 },
  { level: 30, label: "1000 Ink Drops",      type: "ink_drops", amount: 1000 },
  { level: 35, label: "1250 Ink Drops",      type: "ink_drops", amount: 1250 },
  { level: 40, label: "Lexicon Legend",      type: "badge" },
  { level: 45, label: "1500 Ink Drops",      type: "ink_drops", amount: 1500 },
  { level: 50, label: "2000 Ink Drops",      type: "ink_drops", amount: 2000 },
];

/** Progress within current level */
export function getLevelProgress(xp: number): LevelProgress {
  const level = getLevel(xp);
  const xpAtLevelStart = getXPForLevel(level);
  const xpAtNextLevel = getXPForLevel(level + 1);
  const xpNeededForLevel = xpAtNextLevel - xpAtLevelStart;
  const xpInLevel = xp - xpAtLevelStart;
  const progressPercent = xpNeededForLevel > 0
    ? Math.min(100, (xpInLevel / xpNeededForLevel) * 100)
    : 100;

  return {
    level,
    xpInLevel,
    xpNeededForLevel,
    progressPercent,
  };
}
