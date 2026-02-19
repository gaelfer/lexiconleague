"use client";

import { UserProfile, DEFAULT_AVATAR_CONFIG, RankTier } from "@/types";
import { getTierFromTrophies } from "@/lib/rank";
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
  username_changed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function dbProfileToUserProfile(row: DbProfile): UserProfile {
  return {
    id: row.id,
    email: row.email ?? "",
    username: row.username,
    rank_tier: row.rank_tier as RankTier,
    trophies: row.trophies,
    xp: row.xp,
    ink_drops: row.ink_drops,
    unlocked_items: row.unlocked_items ?? [...DEFAULT_UNLOCKED],
    daily_reward_claimed_at: row.daily_reward_claimed_at,
    daily_streak: row.daily_streak,
    avatar_config: {
      ...DEFAULT_AVATAR_CONFIG,
      ...(row.avatar_config as object),
    },
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
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      username: profile.username,
      email: profile.email,
      rank_tier: profile.rank_tier,
      trophies: profile.trophies,
      xp: profile.xp,
      ink_drops: profile.ink_drops,
      unlocked_items: profile.unlocked_items,
      daily_reward_claimed_at: profile.daily_reward_claimed_at,
      daily_streak: profile.daily_streak,
      avatar_config: profile.avatar_config,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) return { success: false, error: error.message };
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
  avatar_config: Record<string, unknown>;
  rank: number;
}

export async function fetchLeaderboard(
  limit = 100
): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, rank_tier, trophies, avatar_config")
    .order("trophies", { ascending: false })
    .limit(limit);

  if (error) return [];

  return (data ?? []).map((row, i) => ({
    id: row.id,
    username: row.username ?? "Challenger",
    rank_tier: row.rank_tier ?? "Bronze",
    trophies: row.trophies ?? 0,
    avatar_config: (row.avatar_config as Record<string, unknown>) ?? {},
    rank: i + 1,
  }));
}
