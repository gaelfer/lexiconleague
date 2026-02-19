import { getProfile, saveProfile, addInkDrops } from "./storage";
import { UserProfile } from "@/types";

export interface DailyReward {
  day: number;
  drops: number;
  label: string;
  bonus?: string;
}

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, drops: 10, label: "Day 1" },
  { day: 2, drops: 15, label: "Day 2" },
  { day: 3, drops: 20, label: "Day 3" },
  { day: 4, drops: 25, label: "Day 4" },
  { day: 5, drops: 30, label: "Day 5" },
  { day: 6, drops: 40, label: "Day 6" },
  { day: 7, drops: 75, label: "Day 7", bonus: "Weekly Bonus!" },
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isYesterday(a: Date, today: Date): boolean {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(a, yesterday);
}

export function canClaimDailyReward(profile: UserProfile): boolean {
  if (!profile.daily_reward_claimed_at) return true;
  const lastClaim = new Date(profile.daily_reward_claimed_at);
  const now = new Date();
  return !isSameDay(lastClaim, now);
}

export function getCurrentStreakDay(profile: UserProfile): number {
  const streak = profile.daily_streak ?? 0;
  return (streak % 7) + 1;
}

export function getTodayReward(profile: UserProfile): DailyReward {
  const day = getCurrentStreakDay(profile);
  return DAILY_REWARDS[day - 1];
}

export function claimDailyReward(profile: UserProfile): {
  updatedProfile: UserProfile;
  reward: DailyReward;
} {
  const now = new Date();
  let streak = profile.daily_streak ?? 0;

  if (profile.daily_reward_claimed_at) {
    const lastClaim = new Date(profile.daily_reward_claimed_at);
    if (isYesterday(lastClaim, now)) {
      streak += 1;
    } else if (!isSameDay(lastClaim, now)) {
      streak = 0;
    }
  }

  const dayIndex = streak % 7;
  const reward = DAILY_REWARDS[dayIndex];

  profile.daily_streak = streak;
  profile.daily_reward_claimed_at = now.toISOString();
  profile.ink_drops = (profile.ink_drops ?? 0) + reward.drops;
  saveProfile(profile);

  return { updatedProfile: profile, reward };
}
