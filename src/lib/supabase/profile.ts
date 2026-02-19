"use client";

import { UserProfile, DEFAULT_AVATAR_CONFIG, RankTier, VocabLevel } from "@/types";
import { getTierFromTrophies } from "@/lib/game/rank";
import { createClient } from "./client";

const DEFAULT_UNLOCKED = [
  "droplet_01",
  "droplet_02",
  "color_#1E293B",
  "color_#3B82F6",
  "eyes_01",
  "none",
];

export interface DbProfile {
  id: string;
  username: string;
  email: string | null;
  rank_tier: string;
  trophies: number;
  xp: number;
  ink_drops: number;
  unlocked_items: string[];
  daily_reward_claimed_at: string | null;
  daily_streak: number;
  avatar_config: Record<string, unknown>;
  vocab_grade?: string | null;
  mmr?: number | null;
  placement_vocab_grade?: number | null;
  placement_completed?: boolean | null;
  tutorial_completed?: boolean | null;
  onboarding_completed?: boolean | null;
  username_changed_at: string | null;
  claimed_level_rewards?: number[] | null;
  created_at: string;
  updated_at: string;
}

const VALID_VOCAB_LEVELS: VocabLevel[] = [3, 4, 5, 6, 7, 8, "psat", "sat"];

export function dbProfileToUserProfile(row: DbProfile): UserProfile {
  const raw = row.vocab_grade;
  const vocab_grade = raw && VALID_VOCAB_LEVELS.includes(raw as VocabLevel) ? (raw as VocabLevel) : undefined;
  const trophies = row.trophies ?? 0;
  return {
    id: row.id,
    email: row.email ?? "",
    username: row.username,
    rank_tier: getTierFromTrophies(trophies) as RankTier,
    trophies,
    xp: row.xp,
    ink_drops: row.ink_drops,
    unlocked_items: row.unlocked_items ?? [...DEFAULT_UNLOCKED],
    daily_reward_claimed_at: row.daily_reward_claimed_at,
    daily_streak: row.daily_streak,
    avatar_config: {
      ...DEFAULT_AVATAR_CONFIG,
      ...(row.avatar_config as object),
    },
    vocab_grade,
    mmr: row.mmr ?? undefined,
    placement_vocab_grade: row.placement_vocab_grade != null ? (row.placement_vocab_grade as 3 | 4 | 5 | 6 | 7 | 8) : undefined,
    placement_completed: row.placement_completed ?? undefined,
    tutorial_completed: row.tutorial_completed ?? undefined,
    onboarding_completed: row.onboarding_completed ?? true,
    claimed_level_rewards: Array.isArray(row.claimed_level_rewards) ? row.claimed_level_rewards : undefined,
    created_at: row.created_at,
  };
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return dbProfileToUserProfile(data as DbProfile);
}

export async function upsertProfile(
  userId: string,
  profile: Partial<UserProfile>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const trophies = profile.trophies;
  const rankTier = trophies != null ? getTierFromTrophies(trophies) : profile.rank_tier;

  const payload: Record<string, unknown> = {
    id: userId,
    updated_at: new Date().toISOString(),
  };
  if (profile.username !== undefined) payload.username = profile.username;
  if (profile.email !== undefined) payload.email = profile.email;
  if ((rankTier ?? profile.rank_tier) !== undefined) payload.rank_tier = rankTier ?? profile.rank_tier;
  if (profile.trophies !== undefined) payload.trophies = profile.trophies;
  if (profile.xp !== undefined) payload.xp = profile.xp;
  if (profile.ink_drops !== undefined) payload.ink_drops = profile.ink_drops;
  if (profile.unlocked_items !== undefined) payload.unlocked_items = profile.unlocked_items;
  if (profile.daily_reward_claimed_at !== undefined) payload.daily_reward_claimed_at = profile.daily_reward_claimed_at;
  if (profile.daily_streak !== undefined) payload.daily_streak = profile.daily_streak;
  if (profile.avatar_config !== undefined) payload.avatar_config = profile.avatar_config;
  if (profile.vocab_grade !== undefined) payload.vocab_grade = profile.vocab_grade != null ? String(profile.vocab_grade) : null;
  if (profile.mmr !== undefined) payload.mmr = profile.mmr;
  if (profile.placement_vocab_grade !== undefined) payload.placement_vocab_grade = profile.placement_vocab_grade;
  if (profile.placement_completed !== undefined) payload.placement_completed = profile.placement_completed;
  if (profile.tutorial_completed !== undefined) payload.tutorial_completed = profile.tutorial_completed;
  if (profile.onboarding_completed !== undefined) payload.onboarding_completed = profile.onboarding_completed;
  if (profile.claimed_level_rewards !== undefined) payload.claimed_level_rewards = profile.claimed_level_rewards;

  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Direct update of game progress (trophies, xp, rank_tier, ink_drops).
 * Use this after ranked games to ensure Supabase gets the latest values.
 */
export async function updateProfileGameProgress(
  userId: string,
  profile: Pick<UserProfile, "trophies" | "xp" | "rank_tier" | "ink_drops" | "unlocked_items">
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const rankTier = getTierFromTrophies(profile.trophies);
  const { error } = await supabase
    .from("profiles")
    .update({
      trophies: profile.trophies,
      xp: profile.xp,
      rank_tier: rankTier,
      ink_drops: profile.ink_drops ?? 0,
      unlocked_items: profile.unlocked_items ?? [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function claimLevelRewardRemote(level: number): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("claim_level_reward", { p_level: level });

  if (error) return { success: false, error: error.message };
  const result = (data as { success?: boolean; error?: string } | null) ?? null;
  if (!result?.success) return { success: false, error: result?.error ?? "Failed to claim reward" };
  return { success: true };
}

export async function updateUsername(
  userId: string,
  username: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("username_changed_at")
    .eq("id", userId)
    .single();

  const changedAt = (existing as { username_changed_at?: string } | null)
    ?.username_changed_at;
  if (changedAt) {
    const daysSince = (Date.now() - new Date(changedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 30) {
      return {
        success: false,
        error: `You can change your username again in ${Math.ceil(30 - daysSince)} days.`,
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username: username.trim(),
      username_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  rank_tier: string;
  trophies: number;
  xp: number;
  avatar_config: Record<string, unknown>;
  rank: number;
}

export async function fetchLeaderboard(
  limit = 100
): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, rank_tier, trophies, xp, avatar_config")
    .order("trophies", { ascending: false })
    .limit(limit);

  if (error) return [];

  return (data ?? []).map((row, i) => {
    const trophies = row.trophies ?? 0;
    return {
      id: row.id,
      username: row.username ?? "Challenger",
      rank_tier: getTierFromTrophies(trophies),
      trophies,
      xp: row.xp ?? 0,
      avatar_config: (row.avatar_config as Record<string, unknown>) ?? {},
      rank: i + 1,
    };
  });
}
