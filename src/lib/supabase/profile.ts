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
  ranked_win_streak?: number | null;
  created_at: string;
  updated_at: string;
}

const VALID_VOCAB_LEVELS: VocabLevel[] = [3, 4, 5, 6, 7, 8, "psat", "sat"];
const unsupportedProfileColumns = new Set<string>();

function getMissingColumnFromError(message: string): string | null {
  // PostgREST schema cache error: Could not find the 'ranked_win_streak' column ...
  const schemaCacheMatch = message.match(/Could not find the '([a-zA-Z0-9_]+)' column/i);
  if (schemaCacheMatch?.[1]) return schemaCacheMatch[1];

  // Postgres error: column "ranked_win_streak" of relation "profiles" does not exist
  const postgresMatch = message.match(/column ["']?([a-zA-Z0-9_]+)["']?.*does not exist/i);
  if (postgresMatch?.[1]) return postgresMatch[1];

  return null;
}

function omitUnsupportedColumns(payload: Record<string, unknown>): Record<string, unknown> {
  if (unsupportedProfileColumns.size === 0) return payload;
  const next: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (!unsupportedProfileColumns.has(k)) next[k] = v;
  }
  return next;
}

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
    xp: row.xp ?? 0,
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
    ranked_win_streak: row.ranked_win_streak ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
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

/**
 * Update trophies, XP, ink drops, and related game progress using Supabase update().
 * Use when the profile row already exists (after games, purchases, rewards).
 */
export async function updateProfileProgress(
  userId: string,
  profile: Partial<UserProfile>
): Promise<{ success: boolean; error?: string; rowExists?: boolean }> {
  const supabase = createClient();

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError && typeof window !== "undefined") {
    console.error("[ProfileSync] getSession error:", sessionError.message);
  }
  if (!session) {
    return { success: false, error: "Not authenticated — session expired or missing" };
  }

  const trophies = profile.trophies;
  const rankTier = trophies != null ? getTierFromTrophies(trophies) : profile.rank_tier;

  const basePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    trophies: profile.trophies ?? 0,
    xp: profile.xp ?? 0,
    ink_drops: profile.ink_drops ?? 0,
    rank_tier: rankTier ?? profile.rank_tier ?? "Bronze",
  };
  if (profile.unlocked_items !== undefined) basePayload.unlocked_items = profile.unlocked_items;
  if (profile.ranked_win_streak !== undefined) basePayload.ranked_win_streak = profile.ranked_win_streak;
  if (profile.placement_completed !== undefined) basePayload.placement_completed = profile.placement_completed;
  if (profile.placement_vocab_grade !== undefined) basePayload.placement_vocab_grade = profile.placement_vocab_grade;
  if (profile.mmr !== undefined) basePayload.mmr = profile.mmr;
  if (profile.daily_reward_claimed_at !== undefined) basePayload.daily_reward_claimed_at = profile.daily_reward_claimed_at;
  if (profile.daily_streak !== undefined) basePayload.daily_streak = profile.daily_streak;
  if (profile.claimed_level_rewards !== undefined) basePayload.claimed_level_rewards = profile.claimed_level_rewards;

  let payload = omitUnsupportedColumns(basePayload);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select("id")
      .maybeSingle();

    if (!error) {
      if (!data) {
        if (typeof window !== "undefined") console.warn("[ProfileSync] update affected 0 rows — row may not exist, trying upsert");
        return { success: false, error: "Update affected no rows — RLS may have blocked the write", rowExists: false };
      }
      return { success: true, rowExists: true };
    }

    const missingColumn = getMissingColumnFromError(error.message);
    if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
      unsupportedProfileColumns.add(missingColumn);
      if (typeof window !== "undefined") {
        console.warn(`[ProfileSync] skipping unsupported profiles.${missingColumn}; apply missing migration to persist it.`);
      }
      payload = omitUnsupportedColumns(basePayload);
      continue;
    }

    if (typeof window !== "undefined") console.error("[ProfileSync] update error:", error.message);
    return { success: false, error: error.message };
  }

  return { success: false, error: "Could not update profile after retrying unsupported columns" };
}

export async function upsertProfile(
  userId: string,
  profile: Partial<UserProfile>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { success: false, error: "Not authenticated — session expired or missing" };
  }

  const trophies = profile.trophies;
  const rankTier = trophies != null ? getTierFromTrophies(trophies) : profile.rank_tier;

  const basePayload: Record<string, unknown> = {
    id: userId,
    updated_at: new Date().toISOString(),
  };
  if (profile.username !== undefined) basePayload.username = profile.username;
  if (profile.email !== undefined) basePayload.email = profile.email;
  if ((rankTier ?? profile.rank_tier) !== undefined) basePayload.rank_tier = rankTier ?? profile.rank_tier;
  if (profile.trophies !== undefined) basePayload.trophies = profile.trophies;
  if (profile.xp !== undefined) basePayload.xp = profile.xp;
  if (profile.ink_drops !== undefined) basePayload.ink_drops = profile.ink_drops;
  if (profile.unlocked_items !== undefined) basePayload.unlocked_items = profile.unlocked_items;
  if (profile.daily_reward_claimed_at !== undefined) basePayload.daily_reward_claimed_at = profile.daily_reward_claimed_at;
  if (profile.daily_streak !== undefined) basePayload.daily_streak = profile.daily_streak;
  if (profile.avatar_config !== undefined) basePayload.avatar_config = profile.avatar_config;
  if (profile.vocab_grade !== undefined) basePayload.vocab_grade = profile.vocab_grade != null ? String(profile.vocab_grade) : null;
  if (profile.mmr !== undefined) basePayload.mmr = profile.mmr;
  if (profile.placement_vocab_grade !== undefined) basePayload.placement_vocab_grade = profile.placement_vocab_grade;
  if (profile.placement_completed !== undefined) basePayload.placement_completed = profile.placement_completed;
  if (profile.tutorial_completed !== undefined) basePayload.tutorial_completed = profile.tutorial_completed;
  if (profile.onboarding_completed !== undefined) basePayload.onboarding_completed = profile.onboarding_completed;
  if (profile.claimed_level_rewards !== undefined) basePayload.claimed_level_rewards = profile.claimed_level_rewards;
  if (profile.ranked_win_streak !== undefined) basePayload.ranked_win_streak = profile.ranked_win_streak;

  let payload = omitUnsupportedColumns(basePayload);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("id")
      .single();

    if (!error) {
      if (!data) {
        if (typeof window !== "undefined") console.error("[ProfileSync] upsert returned no data — RLS may have blocked the write");
        return { success: false, error: "Upsert returned no data — RLS may have blocked the write" };
      }
      return { success: true };
    }

    const missingColumn = getMissingColumnFromError(error.message);
    if (missingColumn && Object.prototype.hasOwnProperty.call(payload, missingColumn)) {
      unsupportedProfileColumns.add(missingColumn);
      if (typeof window !== "undefined") {
        console.warn(`[ProfileSync] skipping unsupported profiles.${missingColumn}; apply missing migration to persist it.`);
      }
      payload = omitUnsupportedColumns(basePayload);
      continue;
    }

    if (typeof window !== "undefined") console.error("[ProfileSync] upsert error:", error.message);
    return { success: false, error: error.message };
  }

  return { success: false, error: "Could not upsert profile after retrying unsupported columns" };
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
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, rank_tier, trophies, xp, avatar_config")
      .order("trophies", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("[Leaderboard] fetch failed:", error.message);
      return [];
    }

    const rows = Array.isArray(data) ? data : [];
    return rows
    .filter((row) => row?.id != null)
    .map((row, i) => {
      const trophies = Number(row.trophies) ?? 0;
      return {
        id: String(row.id),
        username: row.username ?? "Challenger",
        rank_tier: getTierFromTrophies(trophies),
        trophies,
        xp: Number(row.xp) || 0,
        avatar_config: (row.avatar_config as Record<string, unknown>) ?? {},
        rank: i + 1,
      };
    });
  } catch (e) {
    console.warn("[Leaderboard] fetch error:", e);
    return [];
  }
}
