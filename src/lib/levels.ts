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
